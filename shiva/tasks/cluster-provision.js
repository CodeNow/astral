'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var exists = require('101/exists');
var isObject = require('101/is-object');
var Cluster = require('../models/cluster');
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;
var server = require('../server').getInstance();;
var Promise = require('bluebird');

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
 * @param {string} job.githubId The Github id for the organization.
 * @return {Promise} A promise that either resolves the job as complete or
 *   rejects the job as failed.
 */
function clusterProvision(job) {
  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-provision',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!exists(job.githubId)) {
      throw new TaskFatalError(
        'cluster-provision',
        'Job missing `githubId` field',
        { job: job }
      );
    }

    return Cluster.githubOrgExists(job.githubId);
  })
  .then(function (orgExists) {
    // If the cluster already exists in the data model, we are done and
    // should not propagate further events.
    if (orgExists) { return; }

    // Insert the cluster into the database
    return Cluster.insert({ 'github_id': job.githubId });
  })
  .then(function () {
    // Propagate the instance creation events
    var jobData = { githubId: job.githubId };
    for (var i = 0; i < process.env.CLUSTER_INITIAL_DOCKS; i++) {
      server.hermes.publish('cluster-instance-provision', jobData);
    }
  });
}
