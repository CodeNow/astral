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

    it('should enqueue a job to create the asg policy', (done) => {
      shivaOrganizationCreated({ organization: { githubId: '12345' } }).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(publisher.publishTask)
        sinon.assert.calledWithExactly(
          publisher.publishTask,
          'asg.create',
          { githubId: '12345' }
        )
        done()
      })
    })
  }) // end 'organization.created'
}) // end 'shiva'
