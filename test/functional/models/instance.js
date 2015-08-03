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
var db = require('database');
var dbFixture = require('../../fixtures/database.js');

describe('models (functional)', function() {
  var clusterRow = {
    id: '1',
    org: '1',
    state: 'down',
    security_group_id: 'security-group',
    ssh_key_name: 'some-key-name',
    subnet: '1.2.3.4/22'
  };

  var instanceRow = {
    id: '1',
    cluster_id: '1',
    type: 'build',
    ami_id: '1234',
    ami_version: '1.0.0',
    aws_type: 't2.micro',
    ram: '1024',
    cpu: '1'
  };

  var volumeRows = [
    { id: '1', cluster_id: '1', volume_type: 'awesome', size: '1024' },
    { id: '2', cluster_id: '1', volume_type: 'neat', size: '2048' },
    { id: '3', cluster_id: '1', volume_type: 'sweet', size: '4096' }
  ];

  describe('Instance', function() {
    beforeEach(dbFixture.truncate);
    beforeEach(function (done) {
      db('clusters').insert(clusterRow).then(function () {
        return db('instances').insert(instanceRow);
      }).then(function () {
        return db('volumes').insert(volumeRows);
      }).asCallback(done);
    });

    it('should associate volumes with instances', function(done) {
      instance.addVolume('1', '2').then(function () {
        return db('instance_volumes').select();
      }).then(function (rows) {
        expect(rows.length).to.equal(1);
        expect(rows[0].instance_id).to.equal('1');
        expect(rows[0].volume_id).to.equal('2');
        done();
      }).catch(done);
    });

    it('should remove volume associations', function(done) {
      instance.addVolume('1', '3').then(function () {
        return instance.removeVolume('1', '3');
      }).then(function () {
        return db('instance_volumes').select();
      }).then(function (rows) {
        expect(rows.length).to.equal(0);
        done();
      }).catch(done);
    });

    it('should get all volumes', function(done) {
      instance.addVolume('1', '1').then(function () {
        return instance.addVolume('1', '2');
      }).then(function () {
        return instance.addVolume('1', '3');
      }).then(function () {
        return instance.getVolumes('1');
      }).then(function (rows) {
        expect(rows.length).to.equal(3);
        done();
      }).catch(done);
    });
  });
});
