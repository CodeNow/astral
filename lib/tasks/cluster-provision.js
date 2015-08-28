'use strict';

require('loadenv')('shiva:env');

var Promise = require('bluebird');
var exists = require('101/exists');
var isObject = require('101/is-object');

var Cluster = require('../models/cluster');
var error = require('../error');
var queue = require('../queue');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');

/**
 * Task handler for `cluster-provision` queue jobs.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterProvision;

/**
 * Creates a build/run cluster for an organization. This task will add the
 * cluster record to the database and enqueue the instance creation jobs.
 * @param {object} job The job the task should complete.
 * @param {string} job.github_id The Github id for the organization.
 * @return {Promise} A promise that either resolves the job as complete or
 *   rejects the job as failed.
 */
function clusterProvision(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-provision',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!exists(job.github_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-provision',
      'Job missing `github_id` field',
      { job: job }
    ));
  }

  return Cluster.githubOrgExists(job.github_id)
    .then(function (orgExists) {
      if (orgExists) {
        // If the cluster already exists in the data model, we are done and
        // should not propagate further events.
        return;
      }

      // Insert the cluster into the database
      return Cluster.insert({ github_id: job.github_id })
        .then(function () {
          queue.publish('cluster-instance-provision', {
            github_id: job.github_id
          });
        });
    })
    .catch(function (err) {
      // Report the error that occurred and reject
      return error.rejectAndReport(new TaskError(
        'cluster-provision',
        'unable to add cluster to the database',
        { job: job, originalError: err }
      ));
    });
}
