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

require('loadenv')('shiva:test');

var instance = require('models/instance');
var dbFixture = require('../../fixtures/database.js');
var cluster = require('models/cluster');

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
    }); // end 'Cluster'
  }); // end 'models'
}); // end 'functional'
