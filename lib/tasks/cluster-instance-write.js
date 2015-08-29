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
module.exports = clusterInstanceWrite;

/**
 * Called after instances have reported as being ready from the provider. This
 * method writes the instance information to our database so that we have them
 * in the data model.
 * @param {object} job Job for the task to complete.
 * @param {object} job.cluster Cluster information for the instance.
 * @param {string} job.role The role of the instance.
 * @param {array} job.instance The instance to write.
 */
function clusterInstanceWrite(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isObject(job.cluster)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `cluster` field of type {object}',
      { job: job }
    ));
  }

  if (!exists(job.cluster.id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `cluster.id` field',
      { job: job }
    ));
  }

  if (!isString(job.role)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `role` field of type {string}',
      { job: job }
    ));
  }

  if (!isObject(job.instance)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `instance` field of type {object}',
      { job: job }
    ));
  }

  if (!isString(job.instance.InstanceId)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `instance.InstanceId` field of type {string}',
      { job: job }
    ));
  }

  if (!isString(job.instance.ImageId)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `instance.ImageId` field of type {string}',
      { job: job }
    ));
  }

  if (!isString(job.instance.InstanceType)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `instance.InstanceType` field of type {string}',
      { job: job }
    ));
  }
  if (!isString(job.instance.PrivateIpAddress)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-write',
      'Job missing `instance.PrivateIpAddress` field of type {string}',
      { job: job }
    ));
  }

  var row = {
    id: job.instance.InstanceId,
    cluster_id: job.cluster.id,
    role: job.role,
    aws_image_id: job.instance.ImageId,
    aws_instance_type: job.instance.InstanceType,
    aws_private_ip_address: job.instance.PrivateIpAddress
  };

  return Instance.exists(row.id)
    .then(function (instanceExists) {
      if (instanceExists) {
        // Stop processing, an instance with the given already exists.
        return;
      }
      return Instance.insert(row);
    })
    .catch(function (err) {
      return error.rejectAndReport(new TaskError(
        'cluster-instance-write',
        'Failed to write instances to database',
        { job: job, originalError: err }
      ));
    });
}
