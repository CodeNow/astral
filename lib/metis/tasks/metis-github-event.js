'use strict';

var TaskFatalError = require('ponos').TaskFatalError;
var Promise = require('bluebird');

/**
 * Task handler for incoming github events.
 * @module astral:metis:tasks
 */
module.exports = githubEvent;

/**
 * Normalizes incoming github events and writes them to the database.
 * @param {object} job The job the task should handle.
 * @param {string} job.type The type of the github event.
 * @param {sriing} job.githubEventData The data for the github event.
 */
function githubEvent() {
  return Promise.try(function () {
    throw new TaskFatalError('Not Implemented');
  });
}
