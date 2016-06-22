'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var Code = require('code')
var expect = Code.expect
var sinon = require('sinon')
require('sinon-as-promised')(require('bluebird'))

var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AutoScaling = require(process.env.ASTRAL_ROOT + 'shiva/models/aws/auto-scaling')
var CloudWatch = require(process.env.ASTRAL_ROOT + 'shiva/models/aws/cloud-watch')

var asgPolicyScaleOut = require(
  process.env.ASTRAL_ROOT +
  'shiva/tasks/asg.policy.scale-out.create'
)

describe('shiva', function () {
  describe('tasks', function () {
    describe('asg.policy.scale-out.create', function () {
      beforeEach(function (done) {
        sinon.stub(AutoScaling, 'putScalingPolicyAsync').resolves({
          PolicyARN: 'fakePolicyARN'
        })
        sinon.stub(CloudWatch, 'putMetricAlarmAsync').resolves()
        sinon.stub(AutoScaling, 'describeAutoScalingNotificationTypesAsync').resolves({
          AutoScalingNotificationTypes: [
            'one',
            'two',
            'three'
          ]
        })
        sinon.stub(AutoScaling, 'putNotificationConfigurationAsync').resolves()
        done()
      })

      afterEach((done) => {
        AutoScaling.describeAutoScalingNotificationTypesAsync.restore()
        AutoScaling.putScalingPolicyAsync.restore()
        AutoScaling.putNotificationConfigurationAsync.restore()
        CloudWatch.putMetricAlarmAsync.restore()
        done()
      })

      it('should fatally reject if not given a job', function (done) {
        asgPolicyScaleOut().asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/non-object job/)
          done()
        })
      })

      it('should fatally reject without `githubId`', function (done) {
        var job = {}
        asgPolicyScaleOut(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/missing.*githubId.*string/)
          done()
        })
      })

      it('should fatally reject without string `githubId`', function (done) {
        var job = { githubId: 1.0 }
        asgPolicyScaleOut(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/githubId.*string/)
          done()
        })
      })

      it('should make a new scaling policy for the correct asg', (done) => {
        asgPolicyScaleOut({ githubId: '1337' }).asCallback(() => {
          sinon.assert.calledOnce(AutoScaling.putScalingPolicyAsync)
          sinon.assert.calledWithExactly(
            AutoScaling.putScalingPolicyAsync,
            {
              AdjustmentType: 'ChangeInCapacity',
              AutoScalingGroupName: sinon.match(/^asg.+1337$/),
              PolicyName: 'scale-out',
              Cooldown: 600,
              PolicyType: 'SimpleScaling',
              ScalingAdjustment: 1
            }
          )
          done()
        })
      })

      it('should create a new alarm', (done) => {
        asgPolicyScaleOut({ githubId: '1337' }).asCallback(() => {
          sinon.assert.calledOnce(CloudWatch.putMetricAlarmAsync)
          sinon.assert.calledWithExactly(
            CloudWatch.putMetricAlarmAsync,
            {
              AlarmName: 'asg-test-1337-max-available-memory',
              ComparisonOperator: 'LessThanThreshold',
              EvaluationPeriods: 1,
              MetricName: 'Swarm Reserved Memory Maximum Available',
              Namespace: 'Runnable/Swarm',
              Period: 300,
              Statistic: 'Average',
              Threshold: 2.0,
              Dimensions: [{
                Name: 'AutoScalingGroupName',
                Value: 'asg-test-1337'
              }],
              AlarmActions: [ 'fakePolicyARN' ]
            }
          )
          done()
        })
      })

      it('should fetch the NotificationTypes', (done) => {
        asgPolicyScaleOut({ githubId: '1337' }).asCallback(() => {
          sinon.assert.calledOnce(AutoScaling.describeAutoScalingNotificationTypesAsync)
          sinon.assert.calledWithExactly(
            AutoScaling.describeAutoScalingNotificationTypesAsync,
            {}
          )
          done()
        })
      })

      it('should create the notification configuration', (done) => {
        asgPolicyScaleOut({ githubId: '1337' }).asCallback(() => {
          sinon.assert.calledOnce(AutoScaling.putNotificationConfigurationAsync)
          sinon.assert.calledWithExactly(
            AutoScaling.putNotificationConfigurationAsync,
            {
              AutoScalingGroupName: 'asg-test-1337',
              NotificationTypes: [ 'one', 'two', 'three' ],
              TopicARN: 'test-topic-arn'
            }
          )
          done()
        })
      })
    })
  }) // end 'tasks'
}) // end 'shiva'
