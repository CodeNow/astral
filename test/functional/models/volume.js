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

var volume = require('models/volume');
var db = require('database');
var dbFixture = require('../../fixtures/database.js');

describe('functional', function() {
  describe('models', function() {
    var instanceIds = ['1', '2'];

    describe('Volume', function() {
      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster('1').then(function () {
          return dbFixture.createInstances(instanceIds, '1');
        }).then(function () {
          return dbFixture.createVolume('1', '1');
        }).then(function () {
          return dbFixture.setInstanceVolumes(instanceIds[0], ['1']);
        }).then(function () {
          return dbFixture.setInstanceVolumes(instanceIds[1], ['1']);
        }).asCallback(done);
      });

      it('should find all associated instances', function(done) {
        volume.getInstances('1').then(function (rows) {
          expect(rows.length).to.equal(2);
          done();
        }).catch(done);
      });

      it('should require a valid cluster_id', function(done) {
        var invalidRow = {
          cluster_id: 'not-valid',
          volume_type: 'some-type',
          size: 2300
        };
        volume.create(invalidRow).asCallback(function (err) {
          expect(err).to.exist();
          done();
        });
      });
    }); // end 'Volume'
  }); // end 'models'
}); // end 'functional'
