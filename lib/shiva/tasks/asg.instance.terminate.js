'use strict'

var ip = require('ip')
var isObject = require('101/is-object')
var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

var ec2 = require('../models/aws/ec2')

/**
 * Task handler for terminating cluster EC2 instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = asgInstanceTerminate

/**
 * Terminates an EC2 instance with the given private ip address.
 * @param {object} job The job the task is to perform.
 * @param {string} job.instanceId The id of the instance to terminate.
 * @param {string} job.ipAddress The internal IP address for the instance.
 * @return {Promise} A promise that resolves when the instance has been
 *   terminated.
 */
function asgInstanceTerminate (job) {
  return Promise.try(function validateJob () {
    if (!isObject(job)) {
      throw new WorkerStopError(
        'Encountered non-object job'
      )
    }

    if (!ip.isV4Format(job.ipAddress)) {
      throw new WorkerStopError(
        'Job missing valid `ipAddress` of type {string}'
      )
    }
  })
    .then(function findInstanceId () {
      var ipSearchFilters = {
        Filters: [
          { Name: 'private-ip-address', Values: [ job.ipAddress ] }
        ]
      }
      return ec2.describeInstancesAsync(ipSearchFilters)
    })
    .then(function parseInstanceId (data) {
      if (
        data.Reservations.length === 0 ||
        data.Reservations[0].Instances.length === 0
      ) {
        throw new WorkerStopError(
          'Could not find an instance with given private ip address'
        )
      }
      return data.Reservations[0].Instances[0].InstanceId
    })
    .then(function terminateInstance (instanceId) {
      return ec2.terminateInstancesAsync({ InstanceIds: [ instanceId ] })
    })
    .catch(function (err) {
      // If the instance no longer exists then we can acknowledge the job
      // as complete and emit the db record delete job into the queue
      if (err.code === 'InvalidInstanceID.NotFound') {
        throw new WorkerStopError(
          'Instance with the given ip address no longer exists'
        )
      }

      // Otherwise just rethrow the error
      throw err
    })
}
