'use strict';

var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');

var aws = require('../aws');
var Instance = require('../models/instance');
var log = require('../logger');
var Promise = require('bluebird');
var server = require('../server');
var TaskFatalError = require('ponos').TaskFatalError;

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
  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-instance-terminate',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isString(job.instanceId)) {
      throw new TaskFatalError(
        'cluster-instance-terminate',
        'Job missing `id` field of type {string}',
        { job: job }
      );
    }

    if (job.instanceId.length === 0) {
      throw new TaskFatalError(
        'cluster-instance-terminate',
        'Job `id` field cannot be empty',
        { job: job }
      );
    }

    return Instance.get(job.instanceId);
  })
  .then(function (instance) {
    if (!exists(instance)) {
      throw new TaskFatalError(
        'cluster-instance-terminate',
        'Given `instanceId` does not correspond to an instance in the database',
        { job: job }
      );
    }
    return aws.terminateInstances({ InstanceIds: [ job.instanceId ] });
  })
  .then(function () {
    server.hermes.publish('cluster-instance-delete', {
      instanceId: job.instanceId
    });
  })
  .catch(function (err) {
    // If the instance no longer exists then we can acknowledge the job
    // as complete and emit the db record delete job into the queue
    if (err.code === 'InvalidInstanceID.NotFound') {
      log.debug({
        task: 'cluster-instance-terminate',
        instanceId: job.instanceId
      }, 'Instance does not exist on EC2, proceeding with delete.');
      server.hermes.publish('cluster-instance-delete', {
        instanceId: job.instanceId
      });
      return;
    }

    // Otherwise just rethrow the error
    throw err;
  });
}