'use strict'
const astralRequire = require('../../../../test/fixtures/astral-require')
const Code = require('code')
const joi = require('joi')
const Lab = require('lab')
const loadenv = require('loadenv')
const sinon = require('sinon')
const WorkerStopError = require('error-cat/errors/worker-stop-error')
require('sinon-as-promised')(Promise)

const AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
const AWSAlreadyPartOfASGError = astralRequire('shiva/errors/aws-already-part-of-asg-error')
const dockAttach = astralRequire('shiva/tasks/dock.attach').task
const dockAttachSchema = astralRequire('shiva/tasks/dock.attach').jobSchema
const lab = exports.lab = Lab.script()
loadenv.restore()

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

describe('shiva dock.attach unit test', () => {
  describe('jobSchema', () => {
    it('should fatally reject with non-object job', (done) => {
      joi.validate('no way Jose', dockAttachSchema, (err) => {
        expect(err).to.be.an.instanceof(Error)
        expect(err.name).to.match(/ValidationError/)
        done()
      })
    })

    it('should fatally reject without string `githubOrgId`', (done) => {
      joi.validate({}, dockAttachSchema, (err) => {
        expect(err).to.be.an.instanceof(Error)
        expect(err.name).to.match(/ValidationError/)
        done()
      })
    })

    it('should fatally reject with an empty `githubOrgId`', (done) => {
      joi.validate({ githubOrgId: '' }, dockAttachSchema, (err) => {
        expect(err).to.be.an.instanceof(Error)
        expect(err.name).to.match(/ValidationError/)
        done()
      })
    })

    it('should fatally reject with non-string `instanceId`', (done) => {
      let job = { githubOrgId: 'wow', instanceId: 666 }
      joi.validate(job, dockAttachSchema, (err) => {
        expect(err).to.be.an.instanceof(Error)
        expect(err.name).to.match(/ValidationError/)
        done()
      })
    })
  }) // end jobSchema

  describe('task', () => {
    beforeEach((done) => {
      sinon.stub(AutoScalingGroup, 'attachInstance').resolves()
      done()
    })

    afterEach((done) => {
      AutoScalingGroup.attachInstance.restore()
      done()
    })

    it('should throw worker stop if instance already attached', (done) => {
      const githubOrgId = 1337
      const targetASGName = process.env.AWS_AUTO_SCALING_GROUP_PREFIX + githubOrgId
      const instanceId = 'i-4f4nt45y'
      const testError = new Error(`The Instance: ${instanceId} is already part of AutoScalingGroup:${targetASGName}`)
      const job = { githubOrgId: githubOrgId, instanceId: instanceId }
      AutoScalingGroup.attachInstance.rejects(new AWSAlreadyPartOfASGError(testError))
      dockAttach(job).asCallback((err) => {
        expect(err).to.be.an.instanceof(WorkerStopError)
        done()
      })
    })

    it('should throw original error instance already attached', (done) => {
      const githubOrgId = 1337
      const targetASGName = process.env.AWS_AUTO_SCALING_GROUP_PREFIX + githubOrgId
      const instanceId = 'i-4f4nt45y'
      const testError = new Error(`The Instance: ${instanceId} is already part of AutoScalingGroup:${targetASGName}`)
      const job = { githubOrgId: githubOrgId, instanceId: instanceId }
      AutoScalingGroup.attachInstance.rejects(testError)
      dockAttach(job).asCallback((err) => {
        expect(err).to.not.be.an.instanceof(WorkerStopError)
        done()
      })
    })

    it('should call AutoScalingGroup.attachInstances', (done) => {
      let githubOrgId = 1337
      let instanceId = 'i-4f4nt45y'
      const job = { githubOrgId: githubOrgId, instanceId: instanceId }
      dockAttach(job).asCallback((err) => {
        expect(err).to.not.exist()
        expect(AutoScalingGroup.attachInstance.calledOnce).to.be.true()
        expect(AutoScalingGroup.attachInstance.firstCall.args[0]).to.equal('testing-' + githubOrgId)
        expect(AutoScalingGroup.attachInstance.firstCall.args[1]).to.deep.equal([instanceId])
        done()
      })
    })
  }) // end 'task'
}) // end 'shiva'
