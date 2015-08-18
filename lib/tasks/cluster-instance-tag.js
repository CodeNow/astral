'use strict';

require('loadenv')('shiva:env');

var isString = require('101/is-string');
var isObject = require('101/is-object');
var error = require('../error');
var TaskError = require('../errors/task-error');
var TaskFatalError = require('../errors/task-fatal-error');
var aws = require('../providers/aws');

/**
 * Sets tags for instances in a cluster.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceTag;

/**
 * Sets tags for recently built instances. Currently this task sets the
 * following tags on each instance:
 *
 * 1. type=run|build
 * 2. org=<organization_id>
 *
 * @param {object} job Job for the task to complete.
 * @param {string} job.org The id of the organization associated with the
 *   instances being tagged.
 * @param {string} job.type The type of the instances.
 * @param {array} job.instances The instances as reported by the provider.
 */
function clusterInstanceTag(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isString(job.type)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job missing `type` field of type {string}',
      { job: job }
    ));
  }

  if (!isString(job.org)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job missing `org` field of type {string}',
      { job: job }
    ));
  }

  if (!Array.isArray(job.instanceIds)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job missing `instancesIds` field of type {array}',
      { job: job }
    ));
  }

  if (!job.instanceIds.every(isString)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job `instancesIds` field contains a non-string instance id',
      { job: job }
    ));
  }

  return aws.createTags({
    Resources: job.instanceIds,
    Tags: [
      { Key: 'type', Value: job.type },
      { Key: 'org', Value: job.org }
    ]
  });
}
