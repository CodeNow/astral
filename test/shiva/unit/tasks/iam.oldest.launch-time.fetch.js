'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const Code = require('code')
const expect = Code.expect
const moment = require('moment')
const sinon = require('sinon')

const astralRequire = require(
  process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
const loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

const Promise = require('bluebird')
require('sinon-as-promised')(Promise)

const ec2 = astralRequire('shiva/models/aws/ec2')
const oldestLaunchTime = astralRequire('shiva/tasks/iam.oldest.launch-time.fetch')
const publisher = astralRequire('common/models/astral-rabbitmq')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

describe('shiva', function () {
  describe('tasks', function () {
    let oldestInstance
    let instance
    let newestInstance
    describe('iam.oldest.launch-time', function () {
      beforeEach(function (done) {
        oldestInstance = {
          LaunchTime: moment(Date.now()).subtract(4, 'months').toISOString()
        }
        instance = {
          LaunchTime: moment(Date.now()).subtract(1, 'months').toISOString()
        }
        newestInstance = {
          LaunchTime: moment(Date.now()).toISOString()
        }
        sinon.stub(ec2, 'describeInstancesAsync').resolves({
          Reservations: [{
            Instances: [instance, oldestInstance]
          }, {
            Instances: [instance, newestInstance]
          }]
        })
        sinon.stub(publisher, 'publishTask').resolves()
        done()
      })

      afterEach(function (done) {
        ec2.describeInstancesAsync.restore()
        publisher.publishTask.restore()
        done()
      })
      describe('Worker Stop', function () {
        beforeEach(function (done) {
          ec2.describeInstancesAsync.resolves({
            Reservations: []
          })
          done()
        })
        it('should fail', function (done) {
          oldestLaunchTime
            .task({})
            .asCallback(err => {
              expect(err).to.be.an.instanceof(WorkerStopError)
              done()
            })
        })
      })

      it('should call describeInstances with the tag filter', function (done) {
        oldestLaunchTime
          .task({})
          .asCallback(() => {
            sinon.assert.calledWith(ec2.describeInstancesAsync, {
              Filters: [
                { Name: 'tag:role', Values: [ 'dock' ] }
              ]
            })
            done()
          })
      })

      it('should filter out oldUser  user', function (done) {
        oldestLaunchTime
          .task({})
          .asCallback(() => {
            sinon.assert.calledWith(publisher.publishTask, 'iam.cleanup', {
              removeBefore: moment(oldestInstance.LaunchTime).toISOString()
            })
            done()
          })
      })
    })
  })
})
