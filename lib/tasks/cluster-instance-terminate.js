'use strict';

var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');

var aws = require('../providers/aws');
var queue = require('../queue');
var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var Instance = require('../models/instance');

/**
 * Task handler for terminating cluster EC2 instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceTerminate;

/**
 * Terminates an EC2 instance with the given id.
 * @param {object} job The job the task is to perform.
 * @param {string} job.instanceId The id of the instance to terminate.
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

  if (!isString(job.instanceId)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-terminate',
      'Job missing `id` field of type {string}',
      { job: job }
    ));
  }

  if (job.instanceId.length === 0) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-terminate',
      'Job `id` field cannot be empty',
      { job: job }
    ));
  }

  return Instance.get(job.instanceId)
    .then(function (instance) {
      if (!exists(instance)) {
        return error.rejectAndReport(new TaskFatalError(
          'cluster-instance-terminate',
          'Given `id` does not correspond to an instance in the database',
          { job: job }
        ));
      }
      return aws.terminateInstances({ InstanceIds: [ job.instanceId ] })
        .then(function () {
          queue.publish('cluster-instance-delete', {
            instanceId: job.instanceId
          });
        })
        .catch(function (err) {
          return error.rejectAndReport(new TaskError(
            'cluster-instance-terminate',
            'Unable to create instances for cluster',
            { job: job, originalError: err }
          ));
        });
    });
}