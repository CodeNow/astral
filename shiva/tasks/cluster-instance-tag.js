'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var isObject = require('101/is-object');
var isNumber = require('101/is-number');
var isString = require('101/is-string');
var error = require('../error');
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
 * @param {string} job.role The role for the instance.
 * @param {object} job.instanceId The id of the instance to tag.
 */
function clusterInstanceTag(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!isString(job.role)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job missing `role` field of type {string}',
      { job: job }
    ));
  }

  if (!isString(job.org) && !isNumber(job.org)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job missing `org` field',
      { job: job }
    ));
  }

  if (!isString(job.instanceId)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-tag',
      'Job missing `instanceId` field of type {string}',
      { job: job }
    ));
  }

  return aws.createTags({
    Resources: [
      job.instanceId
    ],
    Tags: [
      { Key: 'org', Value: job.org.toString() },
      { Key: 'role', Value: job.role }
    ]
  });
}
