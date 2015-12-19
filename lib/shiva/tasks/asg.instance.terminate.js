'use strict';

var isObject = require('101/is-object');
var isString = require('101/is-string');

var aws = require('../aws');
var Promise = require('bluebird');
var TaskFatalError = require('ponos').TaskFatalError;

/**
 * Task handler for terminating cluster EC2 instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = asgInstanceTerminate;

/**
 * Terminates an EC2 instance with the given id or private ip address.
 * @param {object} job The job the task is to perform.
 * @param {string} job.instanceId The id of the instance to terminate.
 * @param {string} job.ipAddress The internal IP address for the instance.
 * @return {Promise} A promise that resolves when the instance has been
 *   terminated.
 */
function asgInstanceTerminate(job) {
  return Promise.try(function validateJobAndFindId() {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-instance-terminate',
        'Encountered non-object job',
        { job: job }
      );
    }

    var hasInstanceId = isString(job.instanceId);
    var instanceIdLen = hasInstanceId ? job.instanceId.length : 0;
    var hasIpAddress = isString(job.ipAddress);
    var ipAddressLen = hasIpAddress ? job.ipAddress.length : 0;

    if (!hasInstanceId && !hasIpAddress) {
      throw new TaskFatalError(
        'asg.instance.terminate',
        'Job missing `instanceId` or `ipAddress` of type {string}',
        { job: job }
      );
    }

    if (instanceIdLen < 1 && ipAddressLen < 1) {
      throw new TaskFatalError(
        'asg.instance.terminate',
        'Job `instanceId` and `ipAddress` cannot both be empty',
        { job: job }
      );
    }

    // With an instance id we can simply return the id we've been given
    if (hasInstanceId && instanceIdLen > 0) {
      return job.instanceId;
    }

    // If only given an ip address we need to search AWS for the instance's id
    var ipSearchFilters = {
      Filters: [
        { Name: 'private-ip-address', Values: [ job.ipAddress ] }
      ]
    };
    return aws.describeInstances(ipSearchFilters)
      .then(function (data) {
        var instances = [];
        data.Reservations.forEach(function (res) {
          instances = instances.concat(res.Instances);
        });
        if (instances.length < 1) {
          throw new TaskFatalError(
            'asg.instance.terminate',
            'Could not find an instance with given private ip address',
            { job: job }
          );
        }
        return instances[0].InstanceId;
      });
  })
  .then(function terminateInstance(instanceId) {
    return aws.terminateInstances({ InstanceIds: [ instanceId ] });
  })
  .catch(function (err) {
    // If the instance no longer exists then we can acknowledge the job
    // as complete and emit the db record delete job into the queue
    if (err.code === 'InvalidInstanceID.NotFound') {
      throw new TaskFatalError(
        'asg.instance.terminate',
        'Instance with the given id or ip address does not exist',
        { job: job }
      );
    }

    // Otherwise just rethrow the error
    throw err;
  });
}
