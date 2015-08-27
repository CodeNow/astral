'use strict';

require('loadenv')('shiva:env');

var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');

var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var Cluster = require('../models/cluster');
var aws = require('../providers/aws');
var queue = require('../queue');

/**
 * Task handler for creating cluster instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceProvision;

/**
 * Creates instances of a given type for an organization's cluster.
 * @param {object} job The job the task is to perform.
 * @param {object} job.cluster_id Id of the cluster for which to provision.
 * @param {string} job.type The type of instances to spaw for the cluster.
 */
function clusterInstanceProvision(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!exists(job.cluster_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Job missing `cluster_id` field',
      { job: job }
    ));
  }

  if (!isString(job.type)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Job missing `type` field',
      { job: job }
    ));
  }

  if (job.type != 'build' && job.type != 'run') {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Invalid instance type: ' + job.type,
      { job: job }
    ));
  }

  var cluster;

  return Cluster.exists(job.cluster_id)
    .then(function (clusterExists) {
      if (!clusterExists) {
        return error.rejectAndReport(new TaskFatalError(
          'cluster-instance-provision',
          'Unable to find cluster with given id',
          { job: job }
        ));
      }
      return Cluster.get(job.cluster_id)
        .then(function (row) {
          cluster = row;
          return aws.createInstances(cluster, job.type);
        })
        .then(function (instances) {
          queue.publish('cluster-instance-wait', {
            cluster: cluster,
            type: job.type,
            instances: instances
          });
          queue.publish('cluster-instance-tag', {
            instanceIds: instances.map(function (instance) {
              return instance.InstanceId;
            }),
            org: cluster.id,
            type: job.type
          });
        })
        .catch(function (err) {
          return error.rejectAndReport(new TaskError(
            'cluster-instance-provision',
            'Unable to create instances for cluster',
            { job: job, originalError: err }
          ));
        });
    });
}
