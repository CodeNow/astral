'use strict'
require('sinon-as-promised')(require('bluebird'))
const astralRequire = require('../../../../test/fixtures/astral-require')
const Code = require('code')
const expect = Code.expect
const Lab = require('lab')
const loadenv = require('loadenv')
const sinon = require('sinon')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

const publisher = astralRequire('common/models/astral-rabbitmq')
const shivaOrganizationCreated = astralRequire('shiva/events/organization.created')
loadenv.restore()

const lab = exports.lab = Lab.script()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const it = lab.it

describe('shiva organization.created unit test', function () {
  describe('organization.created', function () {
    beforeEach(function (done) {
      sinon.stub(publisher, 'publishTask').resolves()
      done()
    })

    afterEach(function (done) {
      publisher.publishTask.restore()
      done()
    })

    it('should fatally reject with non-object job', function (done) {
      shivaOrganizationCreated('neat').asCallback(function (err) {
        expect(err).to.be.an.instanceof(WorkerStopError)
        expect(err.message).to.match(/non-object.*job/)
        done()
      })
    })

    it('should fatally reject without object `organization`', function (done) {
      shivaOrganizationCreated({}).asCallback(function (err) {
        expect(err).to.be.an.instanceof(WorkerStopError)
        expect(err.message).to.match(/organization.*object/)
        done()
      })
    })

    it('should fatally reject `githubId` when not a safe number', function (done) {
      shivaOrganizationCreated({ organization: { githubId: {} } }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(WorkerStopError)
        expect(err.message).to.match(/githubId.*string/)
        done()
      })
    })

    it('should fatally reject with an empty `githubId`', function (done) {
      shivaOrganizationCreated({ organization: { githubId: '' } }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(WorkerStopError)
        expect(err.message).to.match(/githubId.*empty/)
        done()
      })
    })

    it('should enqueue a job to create the asg policy with githubid as string', (done) => {
      const testJob = {
        organization: {
          githubId: '1234',
          id: 5678,
          isPersonalAccount: false
        }
      }

      shivaOrganizationCreated(testJob).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(publisher.publishTask)
        sinon.assert.calledWithExactly(
          publisher.publishTask,
          'asg.create', {
            githubId: testJob.organization.githubId,
            orgId: testJob.organization.id,
            isPersonalAccount: testJob.organization.isPersonalAccount
          }
        )
        done()
      })
    })

    it('should enqueue a job to create the asg policy with github id as number', (done) => {
      const testJob = {
        organization: {
          githubId: 1234,
          id: 5678,
          isPersonalAccount: false
        }
      }

      shivaOrganizationCreated(testJob).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(publisher.publishTask)
        sinon.assert.calledWithExactly(
          publisher.publishTask,
          'asg.create', {
            githubId: testJob.organization.githubId,
            orgId: testJob.organization.id,
            isPersonalAccount: testJob.organization.isPersonalAccount
          }
        )
        done()
      })
    })

    it('should not call publishTask if a personal account', function (done) {
      shivaOrganizationCreated({organization: {githubId: 1, isPersonalAccount: true}}).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.notCalled(publisher.publishTask)
        done()
      })
    })
  }) // end 'organization.created'
}) // end 'shiva'
