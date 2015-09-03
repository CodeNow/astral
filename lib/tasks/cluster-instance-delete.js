'use strict';

var knex = require('knex');
var isObject = require('101/is-object');
var isString = require('101/is-string');

var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var Instance = require('../models/instance');

/**
 * Task handler for marking EC2 instances as deleted in the database.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceDelete;

/**
 * Marks an EC2 instance as deleted in the databae.
 * @param {object} job The job the task is to perform.
 * @param {string} job.id The id of the instance to mark as deleted.
 * @return {Promise} A promise that resolves when the instance has been
 *   marked as deleted.
 */
function clusterInstanceDelete(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-delete',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isString(job.id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-delete',
      'Job missing `id` field of type {string}',
      { job: job }
    ));
  }

  if (job.id.length === 0) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-delete',
      'Job `id` field cannot be empty',
      { job: job }
    ));
  }

  return Instance.select().where({ id: job.id })
    .then(function (rows) {
      // If the instance has already been set as deleted, we are done.
      if (rows[0].deleted !== null) {
        return;
      }
      return Instance.update(job.id, { deleted: knex.raw('now()') });
    })
    .catch(function (err) {
      return error.rejectAndReport(new TaskError(
        'cluster-instance-delete',
        'Unable to create instances for cluster',
        { job: job, originalError: err }
      ));
    });
}
