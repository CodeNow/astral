'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var Instance = require('../models/instance');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var Promise = require('bluebird');
var TaskFatalError = require('ponos').TaskFatalError;

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
  return Promise.try(function () {
    if (!isObject(job)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Encountered non-object job',
        { job: job }
      );
    }

    if (!isObject(job.cluster)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `cluster` field of type {object}',
        { job: job }
      );
    }

    if (!isString(job.cluster.id)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `cluster.id` field of type {string}',
        { job: job }
      );
    }

    if (!isString(job.role)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `role` field of type {string}',
        { job: job }
      );
    }

    if (!isObject(job.instance)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `instance` field of type {object}',
        { job: job }
      );
    }

    if (!isString(job.instance.InstanceId)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `instance.InstanceId` field of type {string}',
        { job: job }
      );
    }

    if (!isString(job.instance.ImageId)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `instance.ImageId` field of type {string}',
        { job: job }
      );
    }

    if (!isString(job.instance.InstanceType)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `instance.InstanceType` field of type {string}',
        { job: job }
      );
    }
    if (!isString(job.instance.PrivateIpAddress)) {
      throw new TaskFatalError(
        'cluster-instance-write',
        'Job missing `instance.PrivateIpAddress` field of type {string}',
        { job: job }
      );
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
          throw new TaskFatalError(
            'cluster-instance-write',
            'Instance with the given id already exists',
            { job: job }
          );
        }
        return Instance.insert(row);
      });
  });
}
