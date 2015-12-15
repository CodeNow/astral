'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var AutoScalingGroup = require('../models/auto-scaling-group');
var isEmpty = require('101/is-empty');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var TaskFatalError = require('ponos').TaskFatalError;
var Promise = require('bluebird');

/**
 * Task handler for the `shiva-asg-update` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGUpdate;

/**
 * Updates an ASG with the given values.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   update the Auto-Scaling group (see: http://goo.gl/Pc8vJ5).
 * @param {object} job.data Data to update for the ASG.
 * @return {Promise} Resolves on successful delete, rejects otherwise.
 */
function shivaASGUpdate(job) {
  return Promise
    .try(function validateJob() {
      if (!isObject(job)) {
        throw new TaskFatalError(
          'shiva-asg-update',
          'Encountered non-object job',
          { job: job }
        );
      }
      if (!isString(job.githubId)) {
        throw new TaskFatalError(
          'shiva-asg-update',
          'Job missing `githubId` field of type {string}',
          { job: job }
        );
      }
      if (isEmpty(job.githubId)) {
        throw new TaskFatalError(
          'shiva-asg-update',
          'Job `githubId` field cannot be empty',
          { job: job }
        );
      }
      if (!isObject(job.data)) {
        throw new TaskFatalError(
          'shiva-asg-update',
          'Job missing `data` field of type {object}',
          { job: job }
        );
      }
      return AutoScalingGroup.update(job.githubId, job.data);
    });
}
