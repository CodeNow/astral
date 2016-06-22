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

var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
var RabbitMQ = astralRequire('common/models/astral-rabbitmq')
var shivaASGCreate = astralRequire('shiva/tasks/asg.create')

describe('shiva', function () {
  describe('tasks', function () {
    describe('asg.create', function () {
      var mockRabbit
      beforeEach(function (done) {
        mockRabbit = { publishTask: sinon.stub().resolves() }
        sinon.stub(AutoScalingGroup, 'create').returns(Promise.resolve())
        sinon.stub(RabbitMQ, 'getClient').resolves(mockRabbit)
        done()
      })

      afterEach(function (done) {
        AutoScalingGroup.create.restore()
        RabbitMQ.getClient.restore()
        done()
      })

      it('should fatally reject with non-object job', function (done) {
        shivaASGCreate('neat').asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/non-object.*job/)
          done()
        })
      })

      it('should fatally reject without string `githubId`', function (done) {
        shivaASGCreate({}).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/githubId.*string/)
          done()
        })
      })

      it('should fatally reject with an empty `githubId`', function (done) {
        shivaASGCreate({ githubId: '' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/githubId.*empty/)
          done()
        })
      })

      it('should call AutoScalingGroup.create', function (done) {
        var name = '12345'
        shivaASGCreate({ githubId: name }).asCallback(function (err) {
          expect(err).to.not.exist()
          expect(AutoScalingGroup.create.calledWith(name)).to.be.true()
          done()
        })
      })

      it('should create a rabbitmq object', (done) => {
        shivaASGCreate({ githubId: '12345' }).asCallback(function (err) {
          expect(err).to.not.exist()
          sinon.assert.calledOnce(RabbitMQ.getClient)
          done()
        })
      })

      it('should enqueue a job to create the scale-out policy', (done) => {
        shivaASGCreate({ githubId: '12345' }).asCallback(function (err) {
          expect(err).to.not.exist()
          sinon.assert.calledOnce(mockRabbit.publishTask)
          sinon.assert.calledWithExactly(
            mockRabbit.publishTask,
            'asg.policy.scale-out.create',
            { githubId: '12345' }
          )
          done()
        })
      })
    }) // end 'asg.create'
  }) // end 'tasks'
}) // end 'shiva'
