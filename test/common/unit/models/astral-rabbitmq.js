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
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
require('sinon-as-promised')(require('bluebird'))

require('loadenv')({ debugName: 'astral:test' })

var RabbitMQ = require('ponos/lib/rabbitmq')
var Promise = require('bluebird')

var AstralRabbitMQ = astralRequire('common/models/astral-rabbitmq')

describe('common', function () {
  describe('models', function () {
    describe('Astral RabbitMQ - getClient', function () {
      beforeEach((done) => {
        sinon.stub(RabbitMQ.prototype, 'connect').resolves()
        sinon.stub(RabbitMQ.prototype, 'disconnect').resolves()
        done()
      })

      afterEach((done) => {
        RabbitMQ.prototype.connect.restore()
        RabbitMQ.prototype.disconnect.restore()
        done()
      })

      it('should return a promise and client to be used with .using', (done) => {
        Promise.using(AstralRabbitMQ.getClient(), (rabbit) => {
          expect(rabbit).to.exist()
          expect(rabbit).to.be.an.instanceof(RabbitMQ)
          done()
        })
      })

      it('should have connected the client', (done) => {
        Promise.using(AstralRabbitMQ.getClient(), (rabbit) => {
          sinon.assert.calledOnce(RabbitMQ.prototype.connect)
          done()
        })
      })

      it('should disconnect the client when it is done', (done) => {
        Promise.using(AstralRabbitMQ.getClient(), (rabbit) => {
          sinon.assert.notCalled(RabbitMQ.prototype.disconnect)
        })
          .then(() => {
            sinon.assert.calledOnce(RabbitMQ.prototype.disconnect)
            done()
          })
      })
    })
  }) // end 'models'
}) // end 'common'
