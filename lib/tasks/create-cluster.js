'use strict';

require('loadenv')('shiva:env');

var Promise = require('bluebird');
var exists = require('101/exists');
var isObject = require('101/is-object');
var Cluster = require('../models/cluster');
var error = require('../error');
var hermes = require('../queue');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');

/**
 * Task handler for `create-cluster` queue jobs.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = createCluster;

/**
 * Creates a build/run cluster for an organization. This task will add the
 * cluster record to the database and enqueue the instance creation jobs.
 * @param {object} job The job the task should complete.
 * @param {string} job.org_id The Github id for the organization.
 * @return {Promise} A promise that either resolves the job as complete or
 *   rejects the job as failed.
 */
function createCluster(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-cluster',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!exists(job.org_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-cluster',
      'Job missing `org_id` field',
      { job: job }
    ));
  }

  var cluster = {
    id: job.org_id,
    security_group_id: process.env.AWS_CLUSTER_SECURITY_GROUP_ID,
    subnet_id: process.env.AWS_CLUSTER_SUBNET,
    ssh_key_name: process.env.AWS_SSH_KEY_NAME
  };

  return Cluster.exists(cluster.id)
    .then(function (clusterExists) {
      // If the cluster already exists in the data model, we are done and should
      // not propagate further events.
      if (clusterExists) {
        return;
      }

      // Otherwise attempt to insert the cluster information into the data model
      return Cluster.insert(cluster)
        // Send out the create jobs for the build and run instances
        .then(function () {
          hermes.publish('create-instances', {
            cluster_id: cluster.id,
            type: 'build'
          });
          hermes.publish('create-instances', {
            cluster_id: cluster.id,
            type: 'run'
          });
          hermes.publish('check-cluster-ready', { cluster_id: cluster.id });
        })
        // Finally return the information for the cluster that was just created
        .then(function () {
          return cluster;
        });
    })
    .catch(function (err) {
      // Report the error that occurred and reject
      return error.rejectAndReport(new TaskError(
        'create-cluster',
        'unable to add cluster to the database',
        { job: job, originalError: err }
      ));
    });
}
