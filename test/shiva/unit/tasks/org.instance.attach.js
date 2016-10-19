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

var astralRequire = require(
  process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var Promise = require('bluebird')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
var OrgInstanceAttach = astralRequire('shiva/tasks/org.instance.attach').task

describe('shiva', function () {
  describe('tasks', function () {
    describe('org.instance.attach', function () {
      beforeEach(function (done) {
        sinon.stub(AutoScalingGroup, 'attachInstances').returns(Promise.resolve())
        done()
      })

      afterEach(function (done) {
        AutoScalingGroup.attachInstances.restore()
        done()
      })

      it('should fatally reject with non-object job', function (done) {
        OrgInstanceAttach('no way Jose').asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.data.err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should fatally reject without string `githubOrgId`', function (done) {
        OrgInstanceAttach({}).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.data.err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should fatally reject with an empty `githubOrgId`', function (done) {
        OrgInstanceAttach({ githubOrgId: '' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.data.err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should fatally reject with non-string `instanceId`', function (done) {
        let job = { githubOrgId: 'wow', instanceId: 666 }
        OrgInstanceAttach(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(WorkerStopError)
          expect(err.data.err.name).to.match(/ValidationError/)
          done()
        })
      })

      it('should call AutoScalingGroup.attachInstances', function (done) {
        let githubOrgId = '1337 h4x0r'
        let instanceId = 'i-4f4nt45y'
        var job = { githubOrgId: githubOrgId, instanceId: instanceId }
        OrgInstanceAttach(job).then(function (err) {
          expect(err).to.not.exist()
          expect(AutoScalingGroup.attachInstances.calledOnce).to.be.true()
          expect(AutoScalingGroup.attachInstances.firstCall.args[0]).to.equal('testing-' + githubOrgId)
          expect(AutoScalingGroup.attachInstances.firstCall.args[1]).to.deep.equal([instanceId])
          done()
        })
      })
    }) // end 'asg.update'
  }) // end 'tasks'
}) // end 'shiva'
