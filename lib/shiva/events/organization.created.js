'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const isEmpty = require('101/is-empty')
const isObject = require('101/is-object')
const isString = require('101/is-string')
const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const publisher = require('../../common/models/astral-rabbitmq')

module.exports = shivaOrganizationCreated

/**
 * Job to convert organization.created events into asg.create tasks
 * @param {Object} job
 * @param {Object} job.organization
 * @param {string} job.organization.githubId
 * @returns {promise}
 */
function shivaOrganizationCreated (job) {
  return Promise
    .try(() => {
      if (!isObject(job)) {
        throw new WorkerStopError('Encountered non-object job')
      }
      if (!isObject(job.organization)) {
        throw new WorkerStopError(
          'Job missing `organization` field of type {object}'
        )
      }
      if (Number.isSafeInteger(job.organization.githubId) && !isString(job.organization.githubId)) {
        job.organization.githubId = job.organization.githubId.toString()
      }
      if (!isString(job.organization.githubId)) {
        throw new WorkerStopError(
          'Job missing `organization.githubId` field of type {string}'
        )
      }
      if (isEmpty(job.organization.githubId)) {
        throw new WorkerStopError('Job `organization.githubId` field cannot be empty')
      }
    })
    .then(() => {
      if (job.organization.isPersonalAccount) {
        return
      }
      return publisher.publishTask('asg.create', {
        githubId: job.organization.githubId,
        orgId: job.organization.id,
        isPersonalAccount: job.organization.isPersonalAccount
      })
    })
}
