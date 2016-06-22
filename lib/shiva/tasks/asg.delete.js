'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

var isEmpty = require('101/is-empty')
var isObject = require('101/is-object')
var isString = require('101/is-string')
var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AutoScalingGroup = require('../models/auto-scaling-group')

/**
 * Task handler for the `asg.delete` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGDelete

/**
 * Deletes an existing Auto-Scaling group for the given organization.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   delete the Auto-Scaling group.
 * @return {Promise} Resolves on successful delete, rejects otherwise.
 */
function shivaASGDelete (job) {
  return Promise
    .try(function validateJob () {
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
      return AutoScalingGroup.remove(job.githubId)
    })
}
