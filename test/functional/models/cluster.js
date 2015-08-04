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

describe('models (functional)', function() {
  var clusterId = '1';
  var instanceIds = ['1', '2', '3'];
  var volumeIds = ['4', '5', '6'];

  describe('Cluster', function() {
    beforeEach(dbFixture.truncate);
    beforeEach(function (done) {
      dbFixture.createCluster(clusterId).then(function () {
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
  }); // end 'Cluster'
}); // end 'models (functional)'
