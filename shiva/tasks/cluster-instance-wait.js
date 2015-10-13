'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var exists = require('101/exists');
var isString = require('101/is-string');
var isObject = require('101/is-object');
var monitor = require('monitor-dog');
var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var aws = require('../providers/aws');
var queue = require('../queue');

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
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isObject(job.cluster)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `cluster` field of type {object}',
      { job: job }
    ));
  }

  if (!exists(job.cluster.id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `cluster.id` field',
      { job: job }
    ));
  }

  if (!isString(job.role)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `role` field of type {string}',
      { job: job }
    ));
  }

  if (!isObject(job.instance)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `instance` field of type {object}',
      { job: job }
    ));
  }

  if (!isString(job.instance.InstanceId)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `instance.InstanceId` field of type {string}',
      { job: job }
    ));
  }

  var params = { InstanceIds: [job.instance.InstanceId] };

  return aws.waitFor('instanceRunning', params)
    .then(function () {
      queue.publish('cluster-instance-write', {
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
        return error.rejectAndReport(new TaskFatalError(
          'cluster-instance-wait',
          'EC2 instance terminated, cannot wait for it to enter running state',
          { job: job, originalError: err }
        ));
      }

      return error.rejectAndReport(new TaskError(
        'cluster-instance-wait',
        'Failed to determine if instances were ready via provider',
        { job: job, originalError: err }
      ));
    });
}
