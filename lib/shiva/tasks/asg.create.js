'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const isEmpty = require('101/is-empty')
const isObject = require('101/is-object')
const isString = require('101/is-string')
const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const AutoScalingGroup = require('../models/auto-scaling-group')
const publiser = require('../../common/models/astral-rabbitmq')

/**
 * Task handler for the `asg.provision` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGProvision

/**
 * Provisions a new Auto-Scaling Group for the given organization.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   provision the Auto-Scaling group.
 * @return {Promise} Resolves on successful create, rejects otherwise.
 */
function shivaASGProvision (job) {
  return Promise
    .try(function validateJob () {
      if (!isObject(job)) {
        throw new WorkerStopError('Encountered non-object job')
      }
      if (isEmpty(job.isPersonalAccount)) {
        throw new WorkerStopError('Encountered job missing isPersonalAccount')
      }
      if (job.isPersonalAccount) {
        throw new WorkerStopError('Can\'t create servers for personal accounts')
      }
      if (Number.isSafeInteger(job.githubId) && !isString(job.githubId)) {
        job.githubId = job.githubId.toString()
      }
      if (Number.isSafeInteger(job.orgId) && !isString(job.orgId)) {
        job.orgId = job.orgId.toString()
      }
      if (!isString(job.githubId)) {
        throw new WorkerStopError(
          'Job missing `githubId` field of type {string}'
        )
      }
      if (isEmpty(job.githubId)) {
        throw new WorkerStopError('Job `githubId` field cannot be empty')
      }
      return AutoScalingGroup.create(job.githubId, job.orgId)
    })
    .then(() => {
      return publiser.publishTask('pool.dock.detach', {
        githubOrgId: parseInt(job.githubId, 10)
      })
    })
    .then(() => {
      return publiser.publishTask('asg.policy.scale-out.create', job)
    })
}
