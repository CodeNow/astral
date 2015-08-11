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

var noop = require('101/noop');
var instance = require('models/instance');
var volume = require('models/volume');

describe('models', function() {
  describe('Instance', function() {
    describe('constructor', function() {
      it('should set the correct table', function(done) {
        expect(instance.table).to.equal('instances');
        done();
      });

      it('should set the correct primary key', function(done) {
        expect(instance.primaryKey).to.equal('id');
        done();
      });
    }); // end 'constructor'

    describe('addVolume', function() {
      it('should return a promise', function(done) {
        expect(instance.addVolume('a', 'b').then).to.be.a.function();
        done();
      });

      it('should associate the instance to the volume', function(done) {
        var instance_id = 'alpha';
        var volume_id = 'beta';
        sinon.stub(instance, 'db').returns({
          insert: function(opts) {
            expect(instance.db.calledWith('instance_volumes')).to.be.true();
            expect(opts.instance_id).to.equal(instance_id);
            expect(opts.volume_id).to.equal(volume_id);
            instance.db.restore();
            done();
          }
        });
        instance.addVolume(instance_id, volume_id);
      });
    }); // end 'addVolume'

    describe('removeVolume', function() {
      it('should return a promise', function(done) {
        expect(instance.removeVolume('c', 'd').then).to.be.a.function();
        done();
      });

      it('should correctly remove the association', function(done) {
        var instance_id = 'theta';
        var volume_id = 'phi';
        sinon.stub(instance, 'db').returns({
          where: function(opts) {
            expect(instance.db.calledWith('instance_volumes')).to.be.true();
            expect(opts.instance_id).to.equal(instance_id);
            expect(opts.volume_id).to.equal(volume_id);
            instance.db.restore();
            return { del: done };
          }
        });
        instance.removeVolume(instance_id, volume_id);
      });
    }); // end 'removeVolume'

    describe('getVolumes', function() {
      var queryObject = {
        innerJoin: function () { return queryObject; },
        where: function () { return queryObject; }
      };

      it('should return a promise', function(done) {
        expect(instance.getVolumes('a').then).to.be.a.function();
        done();
      });

      it('should construct the correct query', function(done) {
        sinon.stub(volume, 'select').returns(queryObject);
        sinon.spy(queryObject, 'innerJoin');
        sinon.spy(queryObject, 'where');

        var instance_id = '1234';
        instance.getVolumes(instance_id);
        expect(volume.select.calledOnce).to.be.true();
        expect(queryObject.innerJoin.calledWith(
          'instance_volumes',
          'instance_volumes.volume_id',
          'volumes.id'
        )).to.be.true();
        expect(queryObject.where.calledOnce).to.be.true();
        expect(queryObject.where.firstCall.args[0]).to.deep.equal({
          'instance_volumes.instance_id': instance_id
        });

        volume.select.restore();
        queryObject.innerJoin.restore();
        queryObject.where.restore();

        done();
      });
    }); // end 'getVolumes'

  }); // end 'Instance'
}); // end 'models'
