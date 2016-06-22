'use strict'

var isObject = require('101/is-object')
var isString = require('101/is-string')
var Promise = require('bluebird')

var GitHubEvent = require('../../common/models/github-event')
var log = require('../logger').child({ task: 'metis-github-event' })
var NoGithubOrgError = require('../../common/errors/no-github-org-error')
var UniqueError = require('../../common/errors/unique-error')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Task handler for incoming github events.
 * @module astral:metis:tasks
 */
module.exports = metisGithubEvent

/**
 * Normalizes incoming github events and writes them to the database.
 * @param {object} job The job the task should handle.
 * @param {string} job.deliveryId The unique delivery id for the event (sent via
 *   the `x-github-delivery` header to the webhook).
 * @param {string} job.eventType The type of the event (sent via the
 *   `x-github-event` header to the webhook).
 * @param {Number} job.recordedAt Unix timestamp for when the webhook recieved
 *   the event.
 * @param {object} job.payload The body of the event sent to the webhook.
 */
function metisGithubEvent (job) {
  return Promise.try(function validateJob () {
    if (!isObject(job)) {
      throw new WorkerStopError('Encountered non-object job')
    }

    if (!isString(job.deliveryId)) {
      throw new WorkerStopError(
        'Job missing `deliveryId` field of type {string}'
      )
    }

    if (!isString(job.eventType)) {
      throw new WorkerStopError(
        'Job missing `eventType` field of type {string}'
      )
    }

    if (!Number.isInteger(job.recordedAt)) {
      throw new WorkerStopError(
        'Job missing `recordedAt` field of type {integer}'
      )
    }

    if (!isObject(job.payload)) {
      throw new WorkerStopError(
        'Job missing `payload` field of type {object}'
      )
    }

    // Ignore status events, they are not useful for data mining
    if (job.eventType === 'status') {
      log.debug({ job: job }, 'Omitting `status` event payload')
      return
    }

    return GitHubEvent.insert({
      delivery_id: job.deliveryId,
      type: job.eventType,
      recorded_at: job.recordedAt,
      payload: job.payload
    })
  })
    .catch(UniqueError, function (err) {
      var fatalError = new WorkerStopError(
        'Job with given `deliveryId` has already been processed.',
        { originalError: err }
      )
      fatalError.report = false
      throw fatalError
    })
    .catch(NoGithubOrgError, function (err) {
      throw new WorkerStopError(
        'Could not associate github org id with job payload.',
        { originalError: err }
      )
    })
}
