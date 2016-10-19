'use strict'
const Code = require('code')
const Lab = require('lab')
const loadenv = require('loadenv')
const sinon = require('sinon')
const WorkerError = require('error-cat/errors/worker-error')
require('sinon-as-promised')(require('bluebird'))

const astralRequire = require('../../../../test/fixtures/astral-require')

const AutoScaling = astralRequire('shiva/models/aws/auto-scaling')
const DockPool = astralRequire('shiva/models/dock-pool')
const lab = exports.lab = Lab.script()
loadenv.restore()

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

describe('shiva dock-pool unit test', () => {
  const testInstanceId = '12345'
  let testASGInfo

  beforeEach((done) => {
    testASGInfo = {
      AutoScalingGroups: [{
        Instances: [{
          InstanceId: testInstanceId,
          HealthStatus: 'Healthy',
          LifecycleState: 'InService'
        }]
      }]
    }
    done()
  })

  describe('detachRandomInstance', () => {
    beforeEach((done) => {
      sinon.stub(AutoScaling, 'detachInstancesAsync').resolves()
      sinon.stub(AutoScaling, 'describeAutoScalingGroupsAsync').resolves(testASGInfo)
      done()
    })

    afterEach((done) => {
      AutoScaling.detachInstancesAsync.restore()
      AutoScaling.describeAutoScalingGroupsAsync.restore()
      done()
    })

    it('should call AutoScaling.describeAutoScalingGroupsAsync correctly', (done) => {
      DockPool.detachRandomInstance().asCallback((err) => {
        if (err) { return done(err) }
        sinon.assert.calledOnce(AutoScaling.describeAutoScalingGroupsAsync)
        sinon.assert.calledWith(AutoScaling.describeAutoScalingGroupsAsync, {
          AutoScalingGroupNames: [ process.env.DOCK_POOL_ASG_NAME ]
        })
        done()
      })
    })

    it('should call AutoScaling.detachInstancesAsync correctly', (done) => {
      DockPool.detachRandomInstance().asCallback((err) => {
        if (err) { return done(err) }
        sinon.assert.calledOnce(AutoScaling.detachInstancesAsync)
        sinon.assert.calledWith(AutoScaling.detachInstancesAsync, {
          AutoScalingGroupName: process.env.DOCK_POOL_ASG_NAME,
          InstanceIds: [ testInstanceId ],
          ShouldDecrementDesiredCapacity: false
        })
        done()
      })
    })

    it('should return instanceId', (done) => {
      DockPool.detachRandomInstance().asCallback((err, instanceId) => {
        if (err) { return done(err) }
        expect(instanceId).to.equal(testInstanceId)
        done()
      })
    })

    it('should throw when Instances does not exist', (done) => {
      delete testASGInfo.AutoScalingGroups[0].Instances
      DockPool.detachRandomInstance().asCallback((err) => {
        expect(err).to.be.an.instanceOf(WorkerError)
        expect(err.message).to.contain('no instances available in dock pool')
        done()
      })
    })

    it('should throw when Instances is empty', (done) => {
      testASGInfo.AutoScalingGroups[0].Instances = []
      DockPool.detachRandomInstance().asCallback((err) => {
        expect(err).to.be.an.instanceOf(WorkerError)
        expect(err.message).to.contain('no instances available in dock pool')
        done()
      })
    })

    it('should throw when Instance is not healthy', (done) => {
      testASGInfo.AutoScalingGroups[0].Instances[0].HealthStatus = 'Unhealhty'
      DockPool.detachRandomInstance().asCallback((err) => {
        expect(err).to.be.an.instanceOf(WorkerError)
        expect(err.message).to.contain('no healthy instance available in dock pool')
        done()
      })
    })

    it('should throw when Instance is not in good state', (done) => {
      testASGInfo.AutoScalingGroups[0].Instances[0].LifecycleState = 'Pending'
      DockPool.detachRandomInstance().asCallback((err) => {
        expect(err).to.be.an.instanceOf(WorkerError)
        expect(err.message).to.contain('no healthy instance available in dock pool')
        done()
      })
    })

    it('should pick healthy instance', (done) => {
      testASGInfo.AutoScalingGroups[0].Instances.push({
        InstanceId: 'bad-instance',
        HealthStatus: 'Unhealhty',
        LifecycleState: 'InService'
      })
      DockPool.detachRandomInstance().asCallback((err, instanceId) => {
        if (err) { return done(err) }
        expect(instanceId).to.equal(testInstanceId)
        done()
      })
    })
  }) // end 'detachRandomInstance'
}) // end 'shiva'
