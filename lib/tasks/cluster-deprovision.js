'use strict';

var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var isNumber = require('101/is-number');

var Cluster = require('../models/cluster');
var error = require('../error');
var queue = require('../queue');
var TaskFatalError = require('../errors/task-fatal-error');

/**
 * Task handler for `cluster-deprovision` queue jobs.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterDeprovision;

/**
 * Enqueues `cluster-instance-terminate` jobs for each instance in a cluster
 * and enqueus a `cluster-delete` job as well. The will effectively destroy
 * an entire user cluster.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId The Github id for the organization.
 * @return {Promise} A promise that either resolves the job as complete or
 *   rejects the job as failed.
 */
function clusterDeprovision(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-deprovision',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isString(job.githubId) && !isNumber(job.githubId)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-deprovision',
      'Job `githubId` is not a number or a string',
      { job: job }
    ));
  }

  return Cluster.getByGithubId(job.githubId)
    .then(function (cluster) {
      if (!exists(cluster)) {
        return error.rejectAndReport(new TaskFatalError(
          'cluster-deprovision',
          'No cluster exists for given github organization',
          { job: job }
        ));
      }

      if (cluster.deprovisioning) {
        return error.rejectAndReport(new TaskFatalError(
          'cluster-deprovision',
          'The cluster is already being deprovisioned',
          { job: job }
        ));
      }

      return Cluster.setDeprovisioning(cluster.id)
        .then(function () {
          return Cluster.getInstances(cluster.id);
        })
        .then(function (instances) {
          instances.forEach(function (instance) {
            queue.publish('cluster-instance-terminate', {
              instanceId: instance.id
            });
          });
          queue.publish('cluster-delete', { clusterId: cluster.id });
        });
    });
}
