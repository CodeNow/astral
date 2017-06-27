'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const Code = require('code')
const expect = Code.expect
const sinon = require('sinon')

const astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
const loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
const publisher = astralRequire('common/models/astral-rabbitmq')
const shivaASGDelete = astralRequire('shiva/tasks/asg.delete')

describe('shiva', function () {
  describe('tasks', function () {
    describe('asg.delete', function () {
      beforeEach(function (done) {
        sinon.stub(AutoScalingGroup, 'remove').returns(Promise.resolve())
        sinon.stub(publisher, 'publishTask').returns(Promise.resolve())
        done()
      })

      afterEach(function (done) {
        AutoScalingGroup.remove.restore()
        publisher.publishTask.restore()
        done()
      })

      it('should fatally reject with non-object job', function (done) {
        shivaASGDelete('neat').asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/non-object.*job/)
          done()
        })
      })

      it('should fatally reject without string `githubId`', function (done) {
        shivaASGDelete({}).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/githubId.*string/)
          done()
        })
      })

      it('should fatally reject with an empty `githubId`', function (done) {
        shivaASGDelete({ githubId: '' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.message).to.match(/githubId.*empty/)
          done()
        })
      })

      it('should call AutoScalingGroup.remove', function (done) {
        var name = '62738729'
        shivaASGDelete({ githubId: name }).asCallback(function (err) {
          expect(err).to.not.exist()
          expect(AutoScalingGroup.remove.calledWith(name)).to.be.true()
          done()
        })
      })

      it('should publish cleanup task', function (done) {
        var name = '62738729'
        shivaASGDelete({ githubId: name }).asCallback(function (err) {
          expect(err).to.not.exist()
          sinon.assert.calledOnce(publisher.publishTask)
          sinon.assert.calledWith(publisher.publishTask, 'iam.cleanup', {
            ownedBy: name
          })
          done()
        })
      })
    }) // end 'asg.delete'
  }) // end 'tasks'
}) // end 'shiva'
