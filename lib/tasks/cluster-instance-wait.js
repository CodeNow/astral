'use strict';

require('loadenv')('shiva:env');

var exists = require('101/exists');
var isString = require('101/is-string');
var isObject = require('101/is-object');
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
 * @param {string} job.type The type of the instances.
 * @param {array} job.instances The instances as reported by the provider.
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

  if (!isString(job.type)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `type` field of type {string}',
      { job: job }
    ));
  }

  if (!Array.isArray(job.instances)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job missing `instances` field of type {array}',
      { job: job }
    ));
  }

  var params = {
    InstanceIds: job.instances.map(function (instance) {
      return isObject(instance) ? instance.InstanceId : null;
    })
  };

  if (!params.InstanceIds.every(isString)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-wait',
      'Job `instances` field contains a malformed instance object',
      { job: job }
    ));
  }

  return aws.waitFor('instanceRunning', params)
    .then(function () {
      queue.publish('cluster-instance-write', {
        cluster: job.cluster,
        type: job.type,
        instances: job.instances
      });
    })
    .catch(function (err) {
      return error.rejectAndReport(new TaskError(
        'cluster-instance-wait',
        'Failed to determine if instances were ready via provider',
        { job: job, originalError: err }
      ));
    });
}
