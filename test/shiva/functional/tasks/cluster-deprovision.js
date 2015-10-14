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

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var Cluster = require('models/cluster');
var dbFixture = require('../../fixtures/database.js');
var clusterDeprovision = require('tasks/cluster-deprovision');
var server = require('server').getInstance();;

describe('functional', function() {
  describe('tasks', function() {
    describe('cluster-deprovision', function() {
      var clusterId = '1122334455';
      var githubId = 'alpha-beta'

      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster(clusterId, {
          github_id: githubId
        }).asCallback(done)
      });

      beforeEach(function (done) {
        sinon.stub(server.hermes, 'publish');
        done();
      });

      afterEach(function (done) {
        server.hermes.publish.restore();
        done();
      });

      it('should set a cluster as deprovisioning', function(done) {
        clusterDeprovision({ githubId: githubId })
          .then(function () {
            return Cluster.get(clusterId);
          })
          .then(function (cluster) {
            expect(cluster.deprovisioning).to.be.true();
            done();
          })
          .catch(done);
      });
    }); //end 'cluster-deprovision'
  }); // end 'tasks'
}); // end 'functional'
