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

var WorkerStopError = require('error-cat/errors/worker-stop-error')

var RabbitMQ = astralRequire('common/models/astral-rabbitmq')
var shivaOrganizationCreated = astralRequire('shiva/events/organization.created')

describe('shiva', function () {
  describe('events', function () {
    describe('organization.created', function () {
      var mockRabbit
      beforeEach(function (done) {
        mockRabbit = { publishTask: sinon.stub().resolves() }
        sinon.stub(RabbitMQ, 'getClient').resolves(mockRabbit)
        done()
      })

      afterEach(function (done) {
        RabbitMQ.getClient.restore()
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

      it('should create a rabbitmq object', (done) => {
        shivaOrganizationCreated({ organization: { githubId: '12345' } }).asCallback(function (err) {
          expect(err).to.not.exist()
          sinon.assert.calledOnce(RabbitMQ.getClient)
          done()
        })
      })

      it('should enqueue a job to create the asg policy', (done) => {
        shivaOrganizationCreated({ organization: { githubId: '12345' } }).asCallback(function (err) {
          expect(err).to.not.exist()
          sinon.assert.calledOnce(mockRabbit.publishTask)
          sinon.assert.calledWithExactly(
            mockRabbit.publishTask,
            'asg.create',
            { githubId: '12345' }
          )
          done()
        })
      })
    }) // end 'organization.created'
  }) // end 'events'
}) // end 'shiva'
