'use strict';

require('loadenv')('shiva:env');
var exists = require('101/exists');
var isObject = require('101/is-object');
var Promise = require('bluebird');

var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var Cluster = require('../models/cluster');
var queue = require('../queue');


/**
 * Task handler: checks the data model to determine whether or not a cluster is
 * ready for use.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = checkClusterReady;

/**
 * Checks the database to determine if a cluster has all of the instances it
 * needs in order to be used by an organization.
 * @param {object} job The job to process.
 * @param {string} job.cluster_id The id of the cluster to check.
 */
function checkClusterReady(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'check-cluster-ready',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!exists(job.cluster_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'check-cluster-ready',
      'Job missing `cluster_id` field',
      { job: job }
    ));
  }

  return new Promise(function (resolve, reject) {
    var checkInterval = setInterval(function () {
      Cluster.countInstances(job.cluster_id, 'run')
        .then(function (count) {
          if (count > 0) {
            clearInterval(checkInterval);
            queue.publish('cluster-ready', { org_id: job.cluster_id });
            resolve();
          }
        })
        .catch(function (err) {
          clearInterval(checkInterval);
          var taskError = new TaskError(
            'check-cluster-ready',
            'Could not count instances for cluster',
            { job: job, originalError: err }
          );
          error.report(taskError);
          error.log(taskError);
          reject(taskError);
        });
    }, process.env.CLUSTER_READY_INTERVAL);
  });
}
