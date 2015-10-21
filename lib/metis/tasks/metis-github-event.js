'use strict';

var TaskFatalError = require('ponos').TaskFatalError;
var Promise = require('bluebird');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var GitHubEvent = require('../../common/models/github-event');
var UniqueError = require('../../common/errors/unique-error');

/**
 * Task handler for incoming github events.
 * @module astral:metis:tasks
 */
module.exports = metisGithubEvent;

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
  return Promise.try(function validateJob() {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'metis-github-event',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isString(job.deliveryId)) {
      throw new TaskFatalError(
        'metis-github-event',
        'Job missing `deliveryId` field of type {string}',
        { job: job }
      );
    }

    if (!isString(job.eventType)) {
      throw new TaskFatalError(
        'metis-github-event',
        'Job missing `eventType` field of type {string}',
        { job: job }
      );
    }

    if (!Number.isInteger(job.recordedAt)) {
      throw new TaskFatalError(
        'metis-github-event',
        'Job missing `recordedAt` field of type {integer}',
        { job: job }
      );
    }

    if (!isObject(job.payload)) {
      throw new TaskFatalError(
        'metis-github-event',
        'Job missing `payload` field of type {object}',
        { job: job }
      );
    }

    return GitHubEvent.insert({
      delivery_id: job.deliveryId,
      type: job.eventType,
      recorded_at: job.recordedAt,
      payload: job.payload
    });
  })
  .catch(UniqueError, function (err) {
    throw new TaskFatalError(
      'metis-github-event',
      'Job with given `deliveryId` has already been processed.',
      { job: job, originalError: err }
    );
  });
}
