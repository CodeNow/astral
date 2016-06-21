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
var fs = require('fs')
var path = require('path')
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')

require('loadenv')({ debugName: 'astral:test' })

var redis = require('redis')
var AstralRedis = astralRequire('common/models/astral-redis')

describe('common', function () {
  describe('models', function () {
    describe('AstralRedis', function () {
      beforeEach(function (done) {
        sinon.stub(AstralRedis.getClient(), 'hgetAsync')
          .returns(Promise.resolve(1))
        sinon.stub(AstralRedis.getClient(), 'hsetAsync')
          .returns(Promise.resolve(1))
        done()
      })

      afterEach(function (done) {
        AstralRedis.getClient().hgetAsync.restore()
        AstralRedis.getClient().hsetAsync.restore()
        done()
      })

      describe('with TLS', function () {
        var prevCACert = process.env.REDIS_CACERT

        beforeEach(function (done) {
          // set up env and stubs
          process.env.REDIS_CACERT = 'foo'
          var readFileSync = fs.readFileSync
          sinon.stub(fs, 'readFileSync', function (path, encoding) {
            if (path === 'foo') { return 'bar' }
            return readFileSync(path, encoding)
          })
          // delete cached module
          var module = path.resolve(__dirname, '../../../../lib/common/models/astral-redis.js')
          delete require.cache[module]
          // re-setup AstralRedis
          AstralRedis = astralRequire('common/models/astral-redis')
          sinon.stub(AstralRedis.getClient(), 'hgetAsync')
          sinon.stub(AstralRedis.getClient(), 'hsetAsync')
          done()
        })

        afterEach(function (done) {
          fs.readFileSync.restore()
          process.env.REDIS_CACERT = prevCACert
          done()
        })

        it('should have provided tls options', function (done) {
          var c = AstralRedis.getClient()
          sinon.assert.called(fs.readFileSync)
          sinon.assert.calledWithExactly(
            fs.readFileSync,
            'foo',
            'utf-8'
          )
          expect(c.connection_options.ca).to.deep.equal([ 'bar' ])
          expect(c.connection_options.reject_unauthorized).to.be.true()
          done()
        })
      })

      describe('getClient', function () {
        it('should return a redis client', function (done) {
          expect(AstralRedis.getClient())
            .to.be.an.instanceof(redis.RedisClient)
          done()
        })
      })

      describe('getGitHubOrgId', function () {
        it('should fetch the organization id for the given name', function (done) {
          var name = 'some-org-name'
          AstralRedis.getGitHubOrgId(name)
          expect(AstralRedis.getClient().hgetAsync.calledWith(
            process.env.REDIS_GITHUB_OWNER_ID_HASH,
            name
          )).to.be.true()
          done()
        })
      }) // end 'getGitHubOrgId'

      describe('setGitHubOrgId', function () {
        it('should set the organization id for the given name', function (done) {
          var name = 'some-org-name'
          var id = 12345
          AstralRedis.setGitHubOrgId(name, id)
          expect(AstralRedis.getClient().hsetAsync.calledWith(
            process.env.REDIS_GITHUB_OWNER_ID_HASH,
            name,
            id
          )).to.be.true()
          done()
        })
      }) // end 'setGitHubOrg'
    })
  }) // end 'models'
}) // end 'common'
