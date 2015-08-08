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

    describe('countInstances', function() {
      it('should return a promise', function(done) {
        expect(cluster.countInstances().then).to.be.a.function();
        done();
      });

      it('should use the correct count query', function(done) {
        var cluster_id = '123454';
        var type = 'some-type';
        var queryBuilder = {
          where: function (opts) {
            expect(opts).to.deep.equal({
              cluster_id: cluster_id,
              type: type
            });
            return queryBuilder;
          },
          map: function () {
            return queryBuilder;
          },
          reduce: function () {
            done();
          }
        }
        sinon.stub(instance, 'count').returns(queryBuilder);
        cluster.countInstances(cluster_id, type);
      });
    }); // end 'countInstances'

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
  }); // end 'Cluster'
}); // end 'models'
