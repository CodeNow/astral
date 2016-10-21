'use strict'
const astralRequire = require('../../../../test/fixtures/astral-require')
const Code = require('code')
const Lab = require('lab')
const loadenv = require('loadenv')
const sinon = require('sinon')
require('sinon-as-promised')(Promise)

const dockInitialize = astralRequire('shiva/tasks/dock.initialize')
const SendCommand = astralRequire('shiva/models/send-command')
const publisher = astralRequire('common/models/astral-rabbitmq')
const lab = exports.lab = Lab.script()
loadenv.restore()

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

describe('shiva.dock.initialize', function () {
  describe('tasks', function () {
    beforeEach(function (done) {
      sinon.stub(SendCommand, 'sendDockInitCommand').resolves()
      sinon.stub(publisher, 'publishEvent').resolves()
      done()
    })

    afterEach(function (done) {
      SendCommand.sendDockInitCommand.restore()
      publisher.publishEvent.restore()
      done()
    })

    it('should call SendCommand.sendDockInitCommand', function (done) {
      const autoScalingGroupName = 'auto scale groupname'
      const instanceId = 'instance Ids'
      const job = { autoScalingGroupName: autoScalingGroupName, instanceId: instanceId }
      dockInitialize.task(job).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(SendCommand.sendDockInitCommand)
        sinon.assert.calledWith(SendCommand.sendDockInitCommand, instanceId)
        done()
      })
    })

    it('should publish dock.initialized', function (done) {
      const autoScalingGroupName = 'auto scale groupname'
      const instanceId = 'instance Ids'
      const job = { autoScalingGroupName: autoScalingGroupName, instanceId: instanceId }
      dockInitialize.task(job).asCallback(function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(publisher.publishEvent)
        sinon.assert.calledWith(publisher.publishEvent, 'dock.initialized', {
          autoScalingGroupName: job.autoScalingGroupName,
          instanceId: job.instanceId,
          githubOrgId: job.githubOrgId
        })
        done()
      })
    })
  }) // end 'tasks'
}) // end 'shiva.dock.initialize'
