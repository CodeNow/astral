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

  it('should use the internal logger when logging errors', function(done) {
    var err = new Error('this is error!!! (like sparta)');
    error.log(err);
    expect(logger.error.calledWith(err)).to.be.true();
    done();
  });
});
