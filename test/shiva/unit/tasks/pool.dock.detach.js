'use strict'
const Code = require('code')
const Lab = require('lab')
const loadenv = require('loadenv')
const Promise = require('bluebird')
const sinon = require('sinon')

const astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
const DockPool = astralRequire('shiva/models/dock-pool')
const PoolDockDetach = astralRequire('shiva/tasks/pool.dock.detach')
const RabbitMQ = astralRequire('common/models/astral-rabbitmq')

const lab = exports.lab = Lab.script()
loadenv.restore()
require('sinon-as-promised')(require('bluebird'))

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

describe('shiva pool.dock.detach unit test', () => {
  describe('task', () => {
    const testGithubOrgId = 12345
    const testInstanceId = '3487984739'
    let mockRabbit

    beforeEach((done) => {
      mockRabbit = { publishTask: sinon.stub().resolves() }
      sinon.stub(DockPool, 'detachRandomInstance').returns(Promise.resolve(testInstanceId))
      sinon.stub(RabbitMQ, 'getClient').resolves(mockRabbit)
      done()
    })

    afterEach((done) => {
      DockPool.detachRandomInstance.restore()
      RabbitMQ.getClient.restore()
      done()
    })

    it('should call DockPool.detachRandomInstance', (done) => {
      PoolDockDetach.task({ githubOrgId: testGithubOrgId }).asCallback((err) => {
        if (err) { return done(err) }
        sinon.assert.calledOnce(DockPool.detachRandomInstance)
        done()
      })
    })

    it('should enqueue dock.attach task', (done) => {
      PoolDockDetach.task({ githubOrgId: testGithubOrgId }).asCallback((err) => {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(mockRabbit.publishTask)
        sinon.assert.calledWithExactly(mockRabbit.publishTask, 'dock.attach', {
          githubOrgId: testGithubOrgId,
          instanceId: testInstanceId
        })
        done()
      })
    })
  }) // end 'task'
}) // end 'shiva'
