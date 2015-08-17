'use strict';

require('loadenv')('shiva:env');

var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');

var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var Cluster = require('../models/cluster');
var aws = require('../providers/aws');
var queue = require('../queue');

/**
 * Task handler for creating cluster instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = createInstances;

/**
 * Creates instances of a given type for an organization's cluster.
 * @param {object} job The job the task is to perform.
 * @param {object} job.cluster Cluster information for the instances.
 * @param {string} job.type The type of instances to spaw for the cluster.
 */
function createInstances(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isObject(job.cluster)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Job missing `cluster` field',
      { job: job }
    ));
  }

  if (!exists(job.cluster.id)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Job missing `cluster.id` field',
      { job: job }
    ));
  }

  if (!isString(job.cluster.security_group_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Job missing `cluster.security_group_id` field',
      { job: job }
    ));
  }

  if (!isString(job.cluster.subnet_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Job missing `cluster.subnet_id` field',
      { job: job }
    ));
  }

  if (!isString(job.cluster.ssh_key_name)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Job missing `cluster.ssh_key_name` field',
      { job: job }
    ));
  }

  if (!isString(job.type)) {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Job missing `type` field',
      { job: job }
    ));
  }

  if (job.type != 'build' && job.type != 'run') {
    return error.rejectAndReport(new TaskFatalError(
      'create-instances',
      'Invalid instance type: ' + job.type,
      { job: job }
    ));
  }

  return aws.createInstances(job.cluster, job.type)
    .then(function (instances) {
      queue.publish('check-instances-ready', {
        cluster: job.cluster,
        type: job.type,
        instances: instances
      });
    })
    .catch(function (err) {
      return error.rejectAndReport(new TaskError(
        'create-instances',
        'Unable to create instances for cluster',
        { job: job, originalError: err }
      ));
    });
}
