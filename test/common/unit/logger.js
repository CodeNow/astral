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

require('loadenv')({ debugName: 'astral:test' });

var noop = require('101/noop');

var bunyan = require('bunyan');
var logger = require(process.env.ASTRAL_ROOT + 'common/logger');

describe('common', function () {
  describe('log', function() {
    describe('create', function() {
      it('should create a bunyan logger with the correct name', function(done) {
        expect(logger.create('george').fields.name).to.equal('george');
        done();
      });

      it('should provide default serializers', function(done) {
        var log = logger.create('john');
        expect(log.serializers.err).to.be.a.function();
        expect(log.serializers.env).to.be.a.function();
        done();
      });

      it('should accept new serializers', function(done) {
        var log = logger.create('paul', { noop: noop });
        expect(log.serializers.noop).to.equal(noop);
        done();
      });
    });

    describe('serializers', function() {
      var log = logger.create('ringo');

      describe('err', function() {
        beforeEach(function (done) {
          sinon.spy(bunyan.stdSerializers, 'err');
          done();
        });

        afterEach(function (done) {
          bunyan.stdSerializers.err.restore();
          done();
        });

        it('should report data', function(done) {
          var data = { foo: 'bar' };
          var error = new Error('some error');
          error.data = data;
          var result = log.serializers.err(error);
          expect(result.data).to.deep.equal(data);
          done();
        });

        it('should report all default fields', function(done) {
          var error = new Error('error without data');
          var result = log.serializers.err(error);
          expect(bunyan.stdSerializers.err.calledWith(error)).to.be.true();
          expect(result).to.deep.equal(bunyan.stdSerializers.err.returnValues[0]);
          done();
        });
      }); // end 'err'

      describe('env', function() {
        it('should strip out `npm_*` environment variables', function(done) {
          var env = {
            'npm_a': '1',
            'npm_b': '3',
            'woot': 'snklank222'
          };
          expect(log.serializers.env(env)).to.deep.equal({ 'woot': env.woot });
          done();
        });

        it('should include `npm_package_gitHead` variable', function(done) {
          var env = {
            'npm_package_gitHead': 'totally',
            'awesome': 'sauce'
          };
          expect(log.serializers.env(env)).to.deep.equal(env);
          done();
        });
      }); // end 'env'
    }); // end 'serializers'
  }); // end 'log'
}); // end 'common'
