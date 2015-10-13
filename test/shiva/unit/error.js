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

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });
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
      expect(logger.error.calledOnce).to.be.true();
      expect(logger.error.firstCall.args[1]).to.equal(err.message);
      done();
    });
  }); // end 'log'

  describe('reject', function() {
    beforeEach(function (done) {
      sinon.spy(error, 'log');
      done();
    });

    afterEach(function (done) {
      error.log.restore();
      done();
    });

    it('should return a rejection promise', function (done) {
      var testError = new Error('some error');
      error.reject(testError).catch(function (err) {
        expect(err).to.equal(testError);
        done();
      });
    });

    it('should log the error', function(done) {
      var testError = new Error('another error');
      error.reject(testError).catch(function (err) {
        expect(error.log.calledWith(testError)).to.be.true();
        done();
      });
    });
  }); // end 'reject'

  describe('rejectAndReport', function() {
    beforeEach(function (done) {
      sinon.spy(error, 'log');
      sinon.spy(error, 'report');
      done();
    });

    afterEach(function (done) {
      error.log.restore();
      error.report.restore();
      done();
    });

    it('should return a rejection promise', function (done) {
      var testError = new Error('report me');
      error.rejectAndReport(testError).catch(function (err) {
        expect(err).to.equal(testError);
        done();
      });
    });

    it('should log the error', function(done) {
      var testError = new Error('so reported error');
      error.rejectAndReport(testError).catch(function (err) {
        expect(error.log.calledWith(testError)).to.be.true();
        done();
      });
    });

    it('should report the error', function(done) {
      var testError = new Error('also, report me');
      error.rejectAndReport(testError).catch(function (err) {
        expect(error.report.calledWith(testError)).to.be.true();
        done();
      });
    });
  }); // end 'rejectAndReport'
}); // end 'Error'
