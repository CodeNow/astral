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

var Model = require('models/model');
var cluster = require('models/cluster');
var instance = require('models/instance');
var volume = require('models/volume');

describe('models', function () {
  describe('Cluster', function() {
    describe('constructor', function() {
      it('should set the correct table', function(done) {
        expect(cluster.table).to.equal('clusters');
        done();
      });

      it('should set the correct primary key', function(done) {
        expect(cluster.primaryKey).to.equal('id');
        done();
      });
    }); // end 'Cluster'

    describe('getByOrg', function() {
      it('should return a promise', function(done) {
        expect(cluster.getByOrg('some-org').then).to.be.a.function();
        done();
      });
    }); // end 'getByOrg'

    describe('getInstances', function() {
      it('should return a promise', function(done) {
        expect(cluster.getInstances('some-id').then).to.be.a.function();
        done();
      });

      it('should use the correct instances select query', function(done) {
        var id = 'this-is-id';
        sinon.stub(instance, 'select').returns({
          where: function (opts) {
            expect(opts.cluster_id).to.equal(id);
            instance.select.restore();
            done();
          }
        });
        cluster.getInstances(id);
      });
    }); // end 'getInstances'

    describe('getVolumes', function() {
      it('should return a promise', function(done) {
        expect(cluster.getVolumes('some-id').then).to.be.a.function();
        done();
      });

      it('should use the correct volumes select query', function(done) {
        var id = 'some-volume';
        sinon.stub(volume, 'select').returns({
          where: function (opts) {
            expect(opts.cluster_id).to.equal(id);
            volume.select.restore();
            done();
          }
        });
        cluster.getVolumes(id);
      });
    }); // end 'getVolumes'

    describe('insert', function() {
      beforeEach(function (done) {
        sinon.spy(Model.prototype, 'insert');
        done();
      });

      afterEach(function (done) {
        Model.prototype.insert.restore();
        done();
      });

      it('should return a promise', function(done) {
        expect(cluster.insert({}).then).to.be.a.function();
        done();
      });

      it('should call Model.insert', function(done) {
        cluster.insert({});
        expect(Model.prototype.insert.calledOnce).to.be.true();
        done();
      });

      it('should add an id to the data if not provided', function(done) {
        cluster.insert({});
        expect(Model.prototype.insert.firstCall.args[0].id).to.exist();
        done();
      });

      it('should not set an id if one was provided', function(done) {
        var id = 'woot';
        cluster.insert({ id: id });
        expect(Model.prototype.insert.firstCall.args[0].id).to.equal(id);
        done();
      });
    }); // end 'insert'

    describe('orgExists', function() {
      it('should return a promise', function(done) {
        expect(cluster.orgExists('some-org').then).to.be.a.function();
        done();
      });
    }); // end 'orgExists'
  }); // end 'Cluster'
}); // end 'models'
