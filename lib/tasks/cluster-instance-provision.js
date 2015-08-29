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
module.exports = clusterInstanceProvision;

/**
 * Creates a single instance of a given type for an organization's cluster.
 * @param {object} job The job the task is to perform.
 * @param {object} job.github_id Id of the github organization.
 * @param {string} [job.role=dock] The role for the instance.
 */
function clusterInstanceProvision(job) {
  if (!isObject(job)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Encountered non-object job',
      { job: job }
    ));
  }

  if (!exists(job.github_id)) {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Job missing `github_id` field',
      { job: job }
    ));
  }

  if (!isString(job.role)) {
    job.role = 'dock';
  }

  if (job.role != 'dock') {
    return error.rejectAndReport(new TaskFatalError(
      'cluster-instance-provision',
      'Invalid `role` field',
      { job: job }
    ));
  }

  var cluster;

  return Cluster.githubOrgExists(job.github_id)
    .then(function (clusterExists) {
      if (!clusterExists) {
        return error.rejectAndReport(new TaskFatalError(
          'cluster-instance-provision',
          'Unable to find cluster with given github_id',
          { job: job }
        ));
      }
      return Cluster.getByGithubId(job.github_id)
        .then(function (row) {
          cluster = row;
          return aws.createInstances(cluster);
        })
        .then(function (instances) {
          if (instances.length < 1) {
            return error.rejectAndReport(new TaskError(
              'cluster-instance-provision',
              'AWS did not return any valid instances',
              { job: job }
            ));
          }
          queue.publish('cluster-instance-wait', {
            cluster: cluster,
            role: job.role,
            instance: instances[0]
          });
          queue.publish('cluster-instance-tag', {
            instanceId: instances[0].InstanceId,
            org: cluster.github_id,
            role: job.role
          });
        })
        .catch(function (err) {
          return error.rejectAndReport(new TaskError(
            'cluster-instance-provision',
            'Unable to create instances for cluster',
            { job: job, originalError: err }
          ));
        });
    });
}
