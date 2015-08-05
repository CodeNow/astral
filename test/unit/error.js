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
var logger = require('logger');
var error = require('error');

describe('Error', function() {
  beforeEach(function (done) {
    sinon.spy(logger, 'error');
    done();
  });

  afterEach(function (done) {
    logger.error.restore();
    done();
  });

  describe('log', function() {
    it('should use the internal logger when logging errors', function(done) {
      var err = new Error('this is error!!! (like sparta)');
      error.log(err);
      expect(logger.error.calledWith(err)).to.be.true();
      done();
    });
  });

  describe('reject', function() {
    beforeEach(function (done) {
      sinon.spy(error, 'create');
      done();
    });

    afterEach(function (done) {
      error.create.restore();
      done();
    });

    it('should return a rejection promise', function (done) {
      error.reject(500, 'server error').catch(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('should use `.create` to create the error', function(done) {
      var code = 500;
      var message = 'this is errorlandwow';
      var data = { a: 20 };
      error.reject(code, message, data).catch(function (err) {
        expect(error.create.calledWith(code, message, data)).to.be.true();
        done();
      });
    });
  });
});
