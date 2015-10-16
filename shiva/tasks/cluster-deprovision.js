'use strict';

var Cluster = require('../models/cluster');
var exists = require('101/exists');
var isNumber = require('101/is-number');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var Promise = require('bluebird');
var server = require('../server');
var TaskFatalError = require('ponos').TaskFatalError;

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
  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-deprovision',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isString(job.githubId) && !isNumber(job.githubId)) {
      throw new TaskFatalError(
        'cluster-deprovision',
        'Job `githubId` is not a number or a string',
        { job: job }
      );
    }

    return Cluster.getByGithubId(job.githubId)
  })
  .then(function (cluster) {
    if (!exists(cluster)) {
      throw new TaskFatalError(
        'cluster-deprovision',
        'No cluster exists for given github organization',
        { job: job }
      );
    }

    if (cluster.deprovisioning) {
      throw new TaskFatalError(
        'cluster-deprovision',
        'The cluster is already being deprovisioned',
        { job: job }
      );
    }

    return Cluster.setDeprovisioning(cluster.id)
      .then(function () {
        return Cluster.getInstances(cluster.id);
      })
      .then(function (instances) {
        instances.forEach(function (instance) {
          server.hermes.publish('cluster-instance-terminate', {
            instanceId: instance.id
          });
        });
        server.hermes.publish('cluster-delete', { clusterId: cluster.id });
      });
  });
}
