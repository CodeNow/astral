'use strict';

var Cluster = require('../models/cluster');
var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var Promise = require('bluebird');
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;

/**
 * Task handler for `cluster-delete` queue jobs.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterDelete;

/**
 * @param {object} job The job the task should complete.
 * @param {string} job.clusterId The id of the cluster to delete.
 * @return {Promise} A promise that either resolves the job as complete or
 *   rejects the job as failed.
 */
function clusterDelete(job) {
  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-delete',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isString(job.clusterId)) {
      throw new TaskFatalError(
        'cluster-delete',
        'Job `clusterId` is not of type `string`',
        { job: job }
      );
    }

    return Cluster.get(job.clusterId);
  })
  .then(function (cluster) {
    if (!exists(cluster)) {
      throw new TaskFatalError(
        'cluster-delete',
        'Cluster with given `clusterId` does not exist',
        { job: job }
      );
    }

    if (!cluster.deprovisioning) {
      throw new TaskFatalError(
        'cluster-delete',
        'Cluster with given id is not being deprovisioned',
        { job: job, cluster: cluster }
      );
    }

    return Cluster.getInstances(job.clusterId);
  })
  .then(function (instances) {
    // Determine if all the instances are in a soft deleted state
    var allDeleted = instances
      .map(function (instance) { return exists(instance.deleted); })
      .reduce(function (memo, curr) { return memo && curr; }, true);

    if (!allDeleted) {
      throw new TaskError(
        'cluster-delete',
        'Not all cluster instances have been flagged as deleted',
        { job: job }
      );
    }

    return Cluster.deleteInstances(job.clusterId);
  })
  .then(function () {
    return Cluster.del(job.clusterId);
  });
}
