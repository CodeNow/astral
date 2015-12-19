'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var AutoScalingGroup = require('../models/auto-scaling-group');
var isEmpty = require('101/is-empty');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var TaskFatalError = require('ponos').TaskFatalError;
var Promise = require('bluebird');

/**
 * Task handler for the `asg.delete` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGDelete;

/**
 * Deletes an existing Auto-Scaling group for the given organization.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   delete the Auto-Scaling group.
 * @return {Promise} Resolves on successful delete, rejects otherwise.
 */
function shivaASGDelete(job) {
  return Promise
    .try(function validateJob() {
      if (!isObject(job)) {
        throw new TaskFatalError(
          'asg.delete',
          'Encountered non-object job',
          { job: job }
        );
      }
      if (!isString(job.githubId)) {
        throw new TaskFatalError(
          'asg.delete',
          'Job missing `githubId` field of type {string}',
          { job: job }
        );
      }
      if (isEmpty(job.githubId)) {
        throw new TaskFatalError(
          'asg.delete',
          'Job `githubId` field cannot be empty',
          { job: job }
        );
      }
      return AutoScalingGroup.remove(job.githubId);
    });
}
