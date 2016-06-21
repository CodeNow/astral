'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var AutoScaling = require('../models/aws/auto-scaling');
var CloudWatch = require('../models/aws/cloud-watch');
var isEmpty = require('101/is-empty');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var TaskFatalError = require('ponos').TaskFatalError;
var Promise = require('bluebird');

var TOPICARN = 'arn:aws:sns:us-west-2:437258487404:asg-events-production-delta';

/**
 * Task handler for the `asg.policy.scale-out.create` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGCreateScaleOutPolicy;

/**
 * Provisions a new Auto-Scaling Group for the given organization.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   provision the Auto-Scaling group.
 * @return {Promise} Resolves on successful create, rejects otherwise.
 */
function shivaASGCreateScaleOutPolicy(job) {
  return Promise
    .try(function validateJob() {
      if (!isObject(job)) {
        throw new TaskFatalError(
          'asg.policy.scale-out.create',
          'Encountered non-object job',
          { job: job }
        );
      }
      if (!isString(job.githubId)) {
        throw new TaskFatalError(
          'asg.policy.scale-out.create',
          'Job missing `githubId` field of type {string}',
          { job: job }
        );
      }
      if (isEmpty(job.githubId)) {
        throw new TaskFatalError(
          'asg.policy.scale-out.create',
          'Job `githubId` field cannot be empty',
          { job: job }
        );
      }
      if (!isString(job.asgName)) {
        throw new TaskFatalError(
          'asg.policy.scale-out.create',
          'Job missing `asgName` field of type {string}',
          { job: job }
        );
      }
      if (isEmpty(job.asgName)) {
        throw new TaskFatalError(
          'asg.policy.scale-out.create',
          'Job `asgName` field cannot be empty',
          { job: job }
        );
      }
    })
    .then(function createPolicy () {
      var opts = {
        AdjustmentType: 'ChangeInCapacity',
        AutoScalingGroupName: job.asgName,
        PolicyName: 'scale-out',
        Cooldown: 60 * 10,
        PolicyType: 'SimpleScaling',
        ScalingAdjustment: 1
      };
      return AutoScaling.putScalingPolicyAsync(opts);
    })
    .then(function createAlarm (policyData) {
      var opts = {
        AlarmName: job.asgName + '-max-available-memory',
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'Swarm Reserved Memory Maximum Available',
        Namespace: 'Runnable/Swarm',
        Period: 60 * 5,
        Statistic: 'Average',
        Threshold: 2.0,
        Dimensions: [{
          Name: 'AutoScalingGroupName',
          Value: job.asgName
        }],
        AlarmActions: [ policyData.PolicyARN ]
      };
      return CloudWatch.putMetricAlarmAsync(opts);
    })
    .then(function attachNotificationSNS () {
      return AutoScaling.describeAutoScalingNotificationTypesAsync({})
        .then((data) => {
          var opts = {
            AutoScalingGroupName: job.asgName,
            NotificationTypes: data.AutoScalingNotificationTypes,
            TopicARN: TOPICARN
          };
          return AutoScaling.putNotificationConfigurationAsync(opts);
        });
    });
}
