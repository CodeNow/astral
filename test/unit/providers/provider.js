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

var Provider = require('providers/provider');

describe('providers', function() {
  describe('Provider', function() {
    var provider

    beforeEach(function (done) {
      provider = new Provider();
      done();
    });

    describe('isValidInstanceType', function() {
      it('should accept the `build` type', function(done) {
        expect(provider.isValidInstanceType('build')).to.be.true();
        done();
      });

      it('should accept the `run` type', function(done) {
        expect(provider.isValidInstanceType('run')).to.be.true();
        done();
      });

      it('should not accept an invalid type', function(done) {
        expect(provider.isValidInstanceType('stfu')).to.be.false();
        done();
      });
    }); // end 'isValidInstanceType'

    describe('getTypeEnvironmentPrefix', function() {
      it('should return `BUILD_` when given "build"', function(done) {
        expect(provider.getTypeEnvironmentPrefix('build')).to.equal('BUILD_');
        done();
      });

      it('should return `RUN_` when given "run"', function(done) {
        expect(provider.getTypeEnvironmentPrefix('run')).to.equal('RUN_');
        done();
      });

      it('should be null for any other type', function(done) {
        expect(provider.getTypeEnvironmentPrefix('neat')).to.be.null();
        done();
      });
    }); // end 'getTypeEnvironmentPrefix'

    describe('createInstances', function() {
      it('should be abstract and throw an error', function(done) {
        expect(provider.createInstances).to.throw();
        done();
      });
    }); // end 'createInstances'
  }); // end 'Provider'
}); // end 'providers'
