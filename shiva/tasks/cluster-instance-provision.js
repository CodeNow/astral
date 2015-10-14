'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var aws = require('../aws');
var Cluster = require('../models/cluster');
var exists = require('101/exists');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var Promise = require('bluebird');
var server = require('../server').getInstance();;
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;

/**
 * Task handler for creating cluster instances.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = clusterInstanceProvision;

/**
 * Creates a single instance of a given type for an organization's cluster.
 * @param {object} job The job the task is to perform.
 * @param {object} job.githubId Id of the github organization.
 * @param {string} [job.instanceType] The preferred instance type to provision.
 *   This defaults to `process.env.AWS_INSTANCE_TYPE`.
 */
function clusterInstanceProvision(job) {

  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-instance-provision',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isString(job.githubId)) {
      throw new TaskFatalError(
        'cluster-instance-provision',
        'Job missing `githubId` field of type {string}',
        { job: job }
      );
    }

    return Cluster.githubOrgExists(job.githubId);
  })
  .then(function (clusterExists) {
    if (!clusterExists) {
      throw new TaskFatalError(
        'cluster-instance-provision',
        'Unable to find cluster with given githubId',
        { job: job }
      );
    }
    return Cluster.getByGithubId(job.githubId);
  })
  .then(function (cluster) {
    if (cluster.deprovisioning) {
      throw new TaskFatalError(
        'cluster-instance-provision',
        'Cannot instantiate new instance for deprovisioning cluster',
        { job: job, cluster: cluster }
      );
    }

    var runInstanceParams = {};
    if (exists(job.instanceType)) {
      if (!isString(job.instanceType)) {
        throw new TaskFatalError(
          'cluster-instance-provision',
          'Job provided a non-string `instanceType`',
          { job: job }
        );
      }
      runInstanceParams.InstanceType = job.instanceType;
    }

    return aws.createInstances(cluster, runInstanceParams)
      .then(function (instances) {
        if (instances.length < 1) {
          throw new TaskError(
            'cluster-instance-provision',
            'AWS did not return any valid instances',
            { job: job }
          );
        }

        // It is possible that instances can return in a terminated state
        // if we've hit our limits in EC2
        if (instances[0].State.Name !== 'pending') {
          throw new TaskFatalError(
            'cluster-instance-provision',
            'AWS instance was not returned in a pending state, ' +
            'possible limit issues'
          );
        }

        server.hermes.publish('cluster-instance-wait', {
          cluster: cluster,
          role: 'dock',
          instance: instances[0]
        });

        server.hermes.publish('cluster-instance-tag', {
          instanceId: instances[0].InstanceId,
          org: job.githubId,
          role: 'dock'
        });
      });
  })
}
