'use strict';

var isObject = require('101/is-object');
var isString = require('101/is-string');

var aws = require('../providers/aws');
var queue = require('../queue');
var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');

/**
 * Task handler for terminating cluster EC2 instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceTerminate;

/**
 * Terminates an EC2 instance with the given id.
 * @param {object} job The job the task is to perform.
 * @param {string} job.id The id of the instance to terminate.
 * @return {Promise} A promise that resolves when the instance has been
 *   terminated.
 */
function clusterInstanceTerminate(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-terminate',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isString(job.id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-terminate',
      'Job missing `id` field of type {string}',
      { job: job }
    ));
  }

  if (job.id.length === 0) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-terminate',
      'Job `id` field cannot be empty',
      { job: job }
    ));
  }

  // NOTE No need for idempotence check, `terminateInstances` is idempotent
  return aws.terminateInstances({ InstanceIds: [job.id] })
    .then(function () {
      queue.publish('cluster-instance-delete', { id: job.id });
    })
    .catch(function (err) {
      return error.rejectAndReport(new TaskError(
        'cluster-instance-terminate',
        'Unable to create instances for cluster',
        { job: job, originalError: err }
      ));
    });
}
