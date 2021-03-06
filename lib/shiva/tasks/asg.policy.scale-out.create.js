'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

var isEmpty = require('101/is-empty')
var isObject = require('101/is-object')
var isString = require('101/is-string')
var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AutoScaling = require('../models/aws/auto-scaling')
var AutoScalingGroup = require('../models/auto-scaling-group')
var CloudWatch = require('../models/aws/cloud-watch')

var TOPICARN = process.env.AWS_ASG_TOPIC_ARN

/**
 * Task handler for the `asg.policy.scale-out.create` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
module.exports = shivaASGCreateScaleOutPolicy

/**
 * Provisions a new Auto-Scaling Policy for the given Organzation.
 * @param {object} job The job the task should complete.
 * @param {string} job.githubId Id of the github organization for which to
 *   provision the policy.
 * @return {Promise} Resolves on successful create, rejects otherwise.
 */
function shivaASGCreateScaleOutPolicy (job) {
  return Promise
    .try(function validateJob () {
      if (!isObject(job)) {
        throw new WorkerStopError('Encountered non-object job')
      }
      if (!isString(job.githubId)) {
        throw new WorkerStopError(
          'Job missing `githubId` field of type {string}'
        )
      }
      if (isEmpty(job.githubId)) {
        throw new WorkerStopError('Job `githubId` field cannot be empty')
      }
      job._asgName = AutoScalingGroup._getName(job.githubId)
    })
    .then(function createPolicy () {
      var opts = {
        AdjustmentType: 'ChangeInCapacity',
        AutoScalingGroupName: job._asgName,
        PolicyName: 'scale-out',
        Cooldown: 60 * 10,
        PolicyType: 'SimpleScaling',
        ScalingAdjustment: 1
      }
      return AutoScaling.putScalingPolicyAsync(opts)
    })
    .then(function createAlarm (policyData) {
      var opts = {
        AlarmName: job._asgName + '-max-available-memory',
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'Swarm Reserved Memory Maximum Available',
        Namespace: 'Runnable/Swarm',
        Period: 60 * 5,
        Statistic: 'Average',
        Threshold: 2.0,
        Dimensions: [{
          Name: 'AutoScalingGroupName',
          Value: job._asgName
        }],
        AlarmActions: [ policyData.PolicyARN ]
      }
      return CloudWatch.putMetricAlarmAsync(opts)
    })
    .then(function attachNotificationSNS () {
      return AutoScaling.describeAutoScalingNotificationTypesAsync({})
        .then((data) => {
          var opts = {
            AutoScalingGroupName: job._asgName,
            NotificationTypes: data.AutoScalingNotificationTypes,
            TopicARN: TOPICARN
          }
          return AutoScaling.putNotificationConfigurationAsync(opts)
        })
    })
}
