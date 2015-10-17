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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var dbFixture = require('../../fixtures/database.js');
var db = require(process.env.ASTRAL_ROOT + 'common/database');
var Cluster = require(process.env.ASTRAL_ROOT + 'shiva/models/cluster');
var clusterDelete = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-delete');

describe('shiva', function() {
  describe('functional', function() {
    describe('tasks', function() {
      describe('cluster-delete', function() {
        var clusterId = '1122334455';

        beforeEach(dbFixture.truncate);
        beforeEach(function (done) {
          dbFixture.createCluster(clusterId)
            .then(function () {
              return dbFixture.createInstances(['1', '2', '3'], clusterId);
            })
            .asCallback(done)
        });

        it('should fail if the cluster does not exist', function(done) {
          clusterDelete({ clusterId: 'not-a-thing' }).asCallback(function (err) {
            expect(err).to.exist();
            done();
          });
        });

        it('should fail if the cluster is not being deprovisioned', function(done) {
          clusterDelete({ clusterId: clusterId }).asCallback(function (err) {
            expect(err).to.exist();
            done();
          });
        });

        it('should not delete a cluster if an instance is not deleted', function(done) {
          Cluster.setDeprovisioning(clusterId)
            .then(function () {
              return clusterDelete({ clusterId: clusterId })
                .then(function () { done('did not reject'); })
                .catch(function (err) {
                  done();
                });
            });
        });

        it('should delete all instances', function(done) {
          Cluster.setDeprovisioning(clusterId)
            .then(function () {
              return db('instances')
                .update({ deleted: db.raw('now()') })
                .where({ cluster_id: clusterId });
            })
            .then(function () {
              return clusterDelete({ clusterId: clusterId });
            })
            .then(function () {
              return Cluster.getInstances(clusterId);
            })
            .then(function (instances) {
              expect(instances).to.be.empty();
              done();
            })
            .catch(done);
        });

        it('should delete the cluster', function(done) {
          Cluster.setDeprovisioning(clusterId)
            .then(function () {
              return db('instances')
                .update({ deleted: db.raw('now()') })
                .where({ cluster_id: clusterId });
            })
            .then(function () {
              return clusterDelete({ clusterId: clusterId });
            })
            .then(function () {
              return Cluster.get(clusterId);
            })
            .then(function (cluster) {
              expect(cluster).to.be.null();
              done();
            })
            .catch(done);
        });
      }); //end 'cluster-delete'
    }); // end 'tasks'
  }); // end 'functional'
}); // end 'shiva'
