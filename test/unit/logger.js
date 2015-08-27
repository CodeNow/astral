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

var bunyan = require('bunyan');
var logger = require('logger');

describe('logger', function() {
  describe('serializers', function() {
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
        var result = logger.serializers.err(error);
        expect(result.data).to.deep.equal(data);
        done();
      });

      it('should report all default fields', function(done) {
        var error = new Error('error without data');
        var result = logger.serializers.err(error);
        expect(bunyan.stdSerializers.err.calledWith(error)).to.be.true();
        expect(result).to.deep.equal(bunyan.stdSerializers.err.returnValues[0]);
        done();
      });
    }); // end 'err'
  }); // end 'serializers'
}); // end 'logger'
