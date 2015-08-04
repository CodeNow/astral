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

var dbFixtures = require('../fixtures/database');

var cluster = require('models/cluster');
var instance = require('models/instance');
var volume = require('models/volume');

describe('integration', function() {
  describe('models', function() {
    beforeEach(dbFixtures.truncate);
    beforeEach(function (done) {
      dbFixtures.createCluster('cluster-id').then(function () {
        return dbFixtures.createInstance('instance-id', 'cluster-id');
      }).then(function () {
        return dbFixtures.createVolume('volume-id', 'cluster-id');
      }).asCallback(done);
    });

    it('should require instances have a valid cluster_id', function(done) {
      instance.create({
        cluster_id: 'not-there',
        type: 'build',
        ami_id: 'some-ami-id',
        ami_version: 'some-ami-version',
        ram: 20,
        cpu: 20
      }).asCallback(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('should require volumes have a valid cluster_id', function(done) {
      volume.create({
        cluster_id: 'not-valid',
        volume_type: 'some-type',
        size: 2300
      }).asCallback(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('should require instance_volumes have a valid instance', function(done) {
      instance.addVolume('not-valid', 'volume-id').asCallback(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('should require instance_volumes have a valid volume', function(done) {
      instance.addVolume('instance-id', 'not-valid').asCallback(function (err) {
        expect(err).to.exist();
        done();
      });
    });
  }); // end 'models'
}); // end 'integration'
