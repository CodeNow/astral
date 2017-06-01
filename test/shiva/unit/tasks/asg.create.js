'use strict'
require('sinon-as-promised')(require('bluebird'))
const astralRequire = require('../../../../test/fixtures/astral-require')
const Code = require('code')
const expect = Code.expect
const Lab = require('lab')
const loadenv = require('loadenv')
const Promise = require('bluebird')
const sinon = require('sinon')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
const publisher = astralRequire('common/models/astral-rabbitmq')
const shivaASGCreate = astralRequire('shiva/tasks/asg.create')
loadenv.restore()

const lab = exports.lab = Lab.script()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const it = lab.it

describe('shiva asg.create unit test', function () {
  describe('task', function () {
    beforeEach(function (done) {
      sinon.stub(AutoScalingGroup, 'create').returns(Promise.resolve())
      sinon.stub(publisher, 'publishTask').resolves()
      done()
    })

    afterEach(function (done) {
      AutoScalingGroup.create.restore()
      publisher.publishTask.restore()
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

    it('should fatally reject `githubId` when not a safe number', function (done) {
      shivaASGCreate({ githubId: {} }).asCallback(function (err) {
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
      const name = '12345'
      shivaASGCreate({ githubId: name }).asCallback(function (err) {
        expect(err).to.not.exist()
        expect(AutoScalingGroup.create.calledWith(name)).to.be.true()
        done()
      })
    })

    it('should enqueue a job to create the scale-out policy', (done) => {
      shivaASGCreate({ githubId: '12345' }).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.called(publisher.publishTask)
        sinon.assert.calledWithExactly(
          publisher.publishTask,
          'asg.policy.scale-out.create',
          { githubId: '12345' }
        )
        done()
      })
    })

    it('should enqueue a job to create the scale-out policy', (done) => {
      shivaASGCreate({ githubId: 12345 }).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.called(publisher.publishTask)
        sinon.assert.calledWithExactly(
          publisher.publishTask,
          'asg.policy.scale-out.create',
          { githubId: '12345' }
        )
        done()
      })
    })

    it('should enqueue pool.dock.detach task', (done) => {
      shivaASGCreate({ githubId: 12345 }).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.called(publisher.publishTask)
        sinon.assert.calledWithExactly(
          publisher.publishTask,
          'pool.dock.detach',
          { githubOrgId: 12345 }
        )
        done()
      })
    })
  }) // end 'task'
}) // end 'shiva'
