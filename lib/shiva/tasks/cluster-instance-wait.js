'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var aws = require('../aws');
var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var monitor = require('monitor-dog');
var Promise = require('bluebird');
var server = require('../server');
var TaskFatalError = require('ponos').TaskFatalError;

/**
 * Waits for a given set of instances to be ready.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceWait;

/**
 * Checks to see if a given set of instances in a cluster are up and running.
 * @param {object} job Job for the task to complete.
 * @param {object} job.cluster Cluster information for the instances.
 * @param {string} job.role The role for the instance.
 * @param {array} job.instance The instance upon which to wait.
 */
function clusterInstanceWait(job) {
  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-instance-wait',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isObject(job.cluster)) {
      throw new TaskFatalError(
        'cluster-instance-wait',
        'Job missing `cluster` field of type {object}',
        { job: job }
      );
    }

    if (!exists(job.cluster.id)) {
      throw new TaskFatalError(
        'cluster-instance-wait',
        'Job missing `cluster.id` field',
        { job: job }
      );
    }

    if (!isString(job.role)) {
      throw new TaskFatalError(
        'cluster-instance-wait',
        'Job missing `role` field of type {string}',
        { job: job }
      );
    }

    if (!isObject(job.instance)) {
      throw new TaskFatalError(
        'cluster-instance-wait',
        'Job missing `instance` field of type {object}',
        { job: job }
      );
    }

    if (!isString(job.instance.InstanceId)) {
      throw new TaskFatalError(
        'cluster-instance-wait',
        'Job missing `instance.InstanceId` field of type {string}',
        { job: job }
      );
    }

    return aws.waitFor('instanceRunning', {
      InstanceIds: [job.instance.InstanceId]
    });
  })
  .then(function () {
    server.hermes.publish('cluster-instance-write', {
      cluster: job.cluster,
      role: job.role,
      instance: job.instance
    });
  })
  .catch(function (err) {
    // NOTE Instances can be automatically terminated if we've reached our
    //      limits in EC2. At this point, the instances will never be ready
    //      and we should dequeue this job.
    if (exists(err.code) && err.code === 'ResourceNotReady') {
      monitor.increment('aws.limit.exceeded');
      throw new TaskFatalError(
        'cluster-instance-wait',
        'EC2 instance terminated, cannot wait for it to enter running state',
        { job: job, originalError: err }
      );
    }

    // Otherwise just rethrow the error
    throw err;
  });
}
