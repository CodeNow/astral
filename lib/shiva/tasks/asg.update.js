'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

var isEmpty = require('101/is-empty')
var isObject = require('101/is-object')
var isString = require('101/is-string')
var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AutoScalingGroup = require('../models/auto-scaling-group')

/**
 * Task handler for the `asg.update` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGUpdate

/**
 * Updates an ASG with the given values.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   update the Auto-Scaling group (see: http://goo.gl/Pc8vJ5).
 * @param {object} job.data Data to update for the ASG.
 * @return {Promise} Resolves on successful delete, rejects otherwise.
 */
function shivaASGUpdate (job) {
  return Promise
    .try(function validateJobAndUpdateASG () {
      if (!isObject(job)) {
        throw new WorkerStopError('Encountered non-object job')
      }
      if (!isString(job.githubId)) {
        throw new WorkerStopError(
          'Job missing `githubId` field of type {string}'
        )
      }
      if (isEmpty(job.githubId)) {
        throw new WorkerStopError('Job `githubId` field cannot be empty')
      }
      if (!isObject(job.data)) {
        throw new WorkerStopError('Job missing `data` field of type {object}')
      }
      return AutoScalingGroup.update(job.githubId, job.data)
    })
}
