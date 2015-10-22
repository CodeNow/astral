'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');

require('loadenv')({ debugName: 'astral:test' });

var redis = require('redis');
var AstralRedis = astralRequire('common/models/astral-redis');

describe('common', function() {
  describe('models', function() {
    describe('AstralRedis', function() {
      beforeEach(function (done) {
        sinon.stub(AstralRedis.getClient(), 'hgetAsync')
          .returns(Promise.resolve(1));
        sinon.stub(AstralRedis.getClient(), 'hsetAsync')
          .returns(Promise.resolve(1));
        done();
      });

      afterEach(function (done) {
        AstralRedis.getClient().hgetAsync.restore();
        AstralRedis.getClient().hsetAsync.restore();
        done();
      });

      describe('getClient', function() {
        it('should return a redis client', function(done) {
          expect(AstralRedis.getClient())
            .to.be.an.instanceof(redis.RedisClient);
          done();
        });
      });

      describe('getGitHubOrgId', function() {
        it('should fetch the organization id for the given name', function(done) {
          var name = 'some-org-name'
          AstralRedis.getGitHubOrgId(name);
          expect(AstralRedis.getClient().hgetAsync.calledWith(
            process.env.REDIS_GITHUB_OWNER_ID_HASH,
            name
          )).to.be.true();
          done();
        });
      }); // end 'getGitHubOrgId'

      describe('setGitHubOrgId', function() {
        it('should set the organization id for the given name', function(done) {
          var name = 'some-org-name'
          var id = 12345;
          AstralRedis.setGitHubOrgId(name, id);
          expect(AstralRedis.getClient().hsetAsync.calledWith(
            process.env.REDIS_GITHUB_OWNER_ID_HASH,
            name,
            id
          )).to.be.true();
          done();
        });
      }); // end 'setGitHubOrg'
    });
  }); // end 'models;'
}); // end 'common'
