'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var cluster = require(process.env.ASTRAL_ROOT + 'shiva/models/cluster');
var instance = require(process.env.ASTRAL_ROOT + 'shiva/models/instance');
var dbFixture = require(process.env.ASTRAL_ROOT + '../test/fixtures/database.js');

describe('shiva', function () {
  describe('functional', function() {
    describe('models', function() {
      var clusterId = '1';
      var githubId = '2344';
      var instanceIds = ['1', '2', '3'];
      var volumeIds = ['4', '5', '6'];

      describe('Cluster', function() {
        beforeEach(dbFixture.truncate);
        beforeEach(function (done) {
          dbFixture.createCluster(clusterId, { 'github_id': githubId })
            .then(function () {
              return dbFixture.createInstances(instanceIds, clusterId);
            })
            .asCallback(done);
        });

        it('should find all instances for a cluster', function(done) {
          cluster.getInstances(clusterId).then(function (rows) {
            expect(rows.length).to.equal(instanceIds.length);
            done();
          }).catch(done);
        });

        it('should detemine if a cluster exists for a github org', function(done) {
          cluster.githubOrgExists(githubId).then(function (exists) {
            expect(exists).to.be.true();
            done();
          }).catch(done);
        });

        it('should find a cluster with the given github org', function(done) {
          cluster.getByGithubId(githubId).then(function (cluster) {
            expect(cluster.id).to.equal(clusterId);
            expect(cluster.github_id).to.equal(githubId);
            done();
          });
        });

        it('should set a cluster as deprovisioing', function(done) {
          cluster.getByGithubId(githubId)
            .then(function (githubCluster) {
              var clusterId = githubCluster.id;
              return cluster.setDeprovisioning(clusterId)
                .then(function () {
                  return cluster.get(clusterId);
                })
                .then(function (cluster) {
                  expect(cluster.deprovisioning).to.be.true();
                  done();
                })
            })
            .catch(done);
        });
      }); // end 'Cluster'
    }); // end 'models'
  }); // end 'functional'
}); // end 'shiva'
