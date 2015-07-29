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
var Provider = require('providers/provider.js')

describe('providers', function () {
  describe('Provider', function() {
    var provider;
    beforeEach(function (done) {
      provider = new Provider();
      done();
    });

    describe('VALID_INSTANCE_TYPES', function() {
      it('provides an array of valid instance types', function(done) {
        expect(Provider.VALID_INSTANCE_TYPES).to.be.an.array();
        done();
      });
    }); // end 'VALID_INSTANCE_TYPES'

    describe('isValidType', function() {
      it('correctly identifies a valid instance type', function(done) {
        expect(provider.isValidType('run')).to.be.true();
        expect(provider.isValidType('build')).to.be.true();
        expect(provider.isValidType('services')).to.be.true();
        done();
      });

      it('correctly identifies an invalid instance type', function(done) {
        expect(provider.isValidType('foobar')).to.be.false();
        done();
      });
    }); // end 'isValidType'

    describe('create', function() {
      it('should have a `create` method', function(done) {
        expect(provider.create).to.be.a.function();
        done();
      });

      it('should be abstract and yield an error', function(done) {
        provider.create('run', function (err) {
          expect(err).to.not.be.null();
          expect(err.message).to.equal('Provider.create: not implemented');
          done();
        });
      });
    }); // end 'create'

    describe('remove', function() {
      it('should have a `remove` method', function(done) {
        expect(provider.remove).to.be.a.function();
        done();
      });

      it('should be abstract and yield an error', function(done) {
        provider.remove('some-id', function (err) {
          expect(err).to.not.be.null();
          expect(err.message).to.equal('Provider.remove: not implemented');
          done();
        });
      });
    }); // end 'remove'

    describe('start', function() {
      it('should have a `start` method', function(done) {
        expect(provider.start).to.be.a.function();
        done();
      });

      it('should be abstract and yield an error', function(done) {
        provider.start('some-id', function (err) {
          expect(err).to.not.be.null();
          expect(err.message).to.equal('Provider.start: not implemented');
          done();
        });
      });
    }); // end 'start'

    describe('stop', function() {
      it('should have a `stop` method', function(done) {
        expect(provider.stop).to.be.a.function();
        done();
      });

      it('should be abstract and yield an error', function(done) {
        provider.stop('some-id', function (err) {
          expect(err).to.not.be.null();
          expect(err.message).to.equal('Provider.stop: not implemented');
          done();
        });
      });
    }); // end 'stop'

    describe('info', function() {
      it('should have a `info` method', function(done) {
        expect(provider.info).to.be.a.function();
        done();
      });

      it('should be abstract and yield an error', function(done) {
        provider.info('some-id', function (err) {
          expect(err).to.not.be.null();
          expect(err.message).to.equal('Provider.info: not implemented');
          done();
        });
      });
    }); // end 'info'
  }); // end 'Provider'
}); // end 'providers'
