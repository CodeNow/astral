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

const dockInitialize = astralRequire('shiva/tasks/dock.initialize').task
const SendCommand = astralRequire('shiva/models/send-command')
const publisher = astralRequire('common/models/astral-rabbitmq')

var Promise = require('bluebird')

describe('shiva.dock.initialize', function () {
  describe('tasks', function () {
    beforeEach(function (done) {
      sinon.stub(SendCommand, 'sendDockInitCommand').returns(Promise.resolve())
      sinon.stub(publisher, 'publishTask').resolves()
      done()
    })

    afterEach(function (done) {
      SendCommand.sendDockInitCommand.restore()
      publisher.publishTask.restore()
      done()
    })

    it('should call SendCommand.sendDockInitCommand', function (done) {
      let AutoScalingGroupName = 'auto scale groupname'
      let InstanceIds = ['instance Ids']
      var job = { AutoScalingGroupName: AutoScalingGroupName, InstanceIds: InstanceIds }
      dockInitialize(job).asCallback(function (err) {
        expect(err).to.not.exist()
        expect(SendCommand.sendDockInitCommand.calledOnce).to.be.true()
        expect(SendCommand.sendDockInitCommand.firstCall.args[0]).to.equal(InstanceIds)
        done()
      })
    }) // end 'SendCommand.sendDockInitCommand'
  }) // end 'tasks'
}) // end 'shiva.dock.initialize'
