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

const DockInitialized = astralRequire('shiva/tasks/dock.initialized')
const publisher = astralRequire('common/models/astral-rabbitmq')

describe('shiva.dock.initialized', function () {
  describe('tasks', function () {
    beforeEach(function (done) {
      sinon.stub(publisher, 'publishTask').resolves()
      done()
    })

    afterEach(function (done) {
      publisher.publishTask.restore()
      done()
    })

    it('should publish dock.initialized task', function (done) {
      let autoScalingGroupName = 'auto scale groupname'
      let instanceId = 'instance Id'
      var job = { autoScalingGroupName: autoScalingGroupName, instanceId: instanceId }
      DockInitialized.publishEvent(job).asCallback(function (err) {
        expect(err).to.not.exist()
        expect(publisher.publishTask.calledOnce).to.be.true()
        expect(publisher.publishTask.firstCall.args[0]).to.equal('dock.initialized')
        expect(publisher.publishTask.firstCall.args[1]).to.deep.equal({
          autoScalingGroupName: autoScalingGroupName,
            instanceId: instanceId
        })
        done()
      })
    }) // end 'SendCommand.sendDockInitCommand'
  }) // end 'tasks'
}) // end 'shiva.dock.initialize'
