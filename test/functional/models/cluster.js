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
    var instanceIds = ['1', '2', '3'];
    var volumeIds = ['4', '5', '6'];
    var orgId = 'existing-org-id'

    describe('Cluster', function() {
      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster(clusterId, { org: orgId }).then(function () {
          return dbFixture.createInstances(instanceIds, clusterId);
        }).then(function () {
          return dbFixture.createVolumes(volumeIds, clusterId);
        }).asCallback(done);
      });

      it('should find all instances for a cluster', function(done) {
        cluster.getInstances(clusterId).then(function (rows) {
          expect(rows.length).to.equal(instanceIds.length);
          done();
        }).catch(done);
      });

      it('should find all volumes for a cluster', function(done) {
        cluster.getInstances(clusterId).then(function (rows) {
          expect(rows.length).to.equal(volumeIds.length);
          done();
        }).catch(done);
      });

      it('should correctly insert records into the table', function(done) {
        var record = {
          org: 'some-org',
          state: 'down',
          security_group_id: 'some-security-group',
          subnet: '0.0.0.0/24',
          ssh_key_name: 'an-ssh-key-name'
        };
        cluster.insert(record).then(function (result) {
          expect(result.rowCount).to.equal(1);
          done();
        }).catch(done);
      });

      it('should determine if an org has no cluster', function(done) {
        cluster.orgExists('does-not-exist').then(function (exists) {
          expect(exists).to.be.false();
          done();
        }).catch(done);
      });

      it('should determine if an org has a cluster', function(done) {
        cluster.orgExists(orgId).then(function (exists) {
          expect(exists).to.be.true();
          done();
        }).catch(done);
      });
    }); // end 'Cluster'
  }); // end 'models'
}); // end 'functional'
