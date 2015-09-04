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

require('loadenv')('shiva:test');

var db = require('database');
var Cluster = require('models/cluster');
var dbFixture = require('../../fixtures/database.js');
var clusterDelete = require('tasks/cluster-delete');

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
              .asCallback(function (err) {
                expect(err).to.exist();
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
