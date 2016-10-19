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
const joi = require('joi')

var astralRequire = require(
  process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

const AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
const dockAttach = astralRequire('shiva/tasks/dock.attach').task
const dockAttachSchema = astralRequire('shiva/tasks/dock.attach').jobSchema

describe('shiva', function () {
  describe('tasks', function () {
    describe('org.instance.attach', function () {
      beforeEach(function (done) {
        sinon.stub(AutoScalingGroup, 'attachInstance').returns(Promise.resolve())

        done()
      })

      afterEach(function (done) {
        AutoScalingGroup.attachInstance.restore()
        done()
      })

      it('should fatally reject with non-object job', function (done) {
        joi.validate('no way Jose', dockAttachSchema, (err) => {
          expect(err).to.be.an.instanceof(Error)
          expect(err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should fatally reject without string `githubOrgId`', function (done) {
        joi.validate({}, dockAttachSchema, (err) => {
          expect(err).to.be.an.instanceof(Error)
          expect(err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should fatally reject with an empty `githubOrgId`', function (done) {
        joi.validate({ githubOrgId: '' }, dockAttachSchema, (err) => {
          expect(err).to.be.an.instanceof(Error)
          expect(err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should fatally reject with non-string `instanceId`', function (done) {
        let job = { githubOrgId: 'wow', instanceId: 666 }
        joi.validate(job, dockAttachSchema, (err) => {
          expect(err).to.be.an.instanceof(Error)
          expect(err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should throw a non-validation error in a case', function (done) {
        let job = {githubOrgId: 'wow', instanceId: 666}
        AutoScalingGroup.attachInstance.throws(new Error())
        dockAttach(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          done()
        })
      })

      it('should call AutoScalingGroup.attachInstances', function (done) {
        let githubOrgId = 1337
        let instanceId = 'i-4f4nt45y'
        var job = { githubOrgId: githubOrgId, instanceId: instanceId }
        dockAttach(job).asCallback(function (err) {
          expect(err).to.not.exist()
          expect(AutoScalingGroup.attachInstance.calledOnce).to.be.true()
          expect(AutoScalingGroup.attachInstance.firstCall.args[0]).to.equal('testing-' + githubOrgId)
          expect(AutoScalingGroup.attachInstance.firstCall.args[1]).to.deep.equal([instanceId])
          done()
        })
      }) // end 'dock.attach'
    }) // end 'asg.update'
  }) // end 'tasks'
}) // end 'shiva'
