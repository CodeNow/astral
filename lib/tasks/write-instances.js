'use strict';

require('loadenv')('shiva:env');

var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');

var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var Instance = require('../models/instance');


/**
 * Task handler: writes information concerning recently started instances to the
 * database.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = writeInstances;

/**
 * Called after instances have reported as being ready from the provider. This
 * method writes the instance information to our database so that we have them
 * in the data model.
 * @param {object} job Job for the task to complete.
 * @param {object} job.cluster Cluster information for the instances.
 * @param {string} job.type The type of the instances.
 * @param {array} job.instances The instances as reported by the provider.
 */
function writeInstances(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'write-instances',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isObject(job.cluster)) {
    return error.rejectAndReport(new TaskFatalError(
      'write-instances',
      'Job missing `cluster` field of type {object}',
      { job: job }
    ));
  }

  if (!exists(job.cluster.id)) {
    return error.rejectAndReport(new TaskFatalError(
      'write-instances',
      'Job missing `cluster.id` field',
      { job: job }
    ));
  }

  if (!isString(job.type)) {
    return error.rejectAndReport(new TaskFatalError(
      'write-instances',
      'Job missing `type` field of type {string}',
      { job: job }
    ));
  }

  if (!Array.isArray(job.instances)) {
    return error.rejectAndReport(new TaskFatalError(
      'write-instances',
      'Job missing `instances` field of type {array}',
      { job: job }
    ));
  }

  var wellFormedInstances = job.instances.every(function (instance) {
    return isObject(instance) &&
      isString(instance.InstanceId) &&
      isString(instance.ImageId) &&
      isString(instance.InstanceType);
  });

  if (!wellFormedInstances) {
    return error.rejectAndReport(new TaskFatalError(
      'write-instances',
      'Job `instances` field contains a malformed instance object',
      { job: job }
    ));
  }

  var rows = job.instances.map(function (instance) {
    return {
      id: instance.InstanceId,
      cluster_id: job.cluster.id,
      type: job.type,
      ami_id: instance.ImageId,
      aws_type: instance.InstanceType
    };
  });

  return Instance.insert(rows)
    .catch(function (err) {
      return error.rejectAndReport(new TaskError(
        'write-instances',
        'Failed to write instances to database',
        { job: job, originalError: err }
      ));
    });
}
