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
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');

require('loadenv')({ debugName: 'astral:test' });

var InvalidArgumentError = astralRequire('common/errors/invalid-argument-error');

describe('common', function() {
  describe('errors', function() {
    describe('InvalidArgumentError', function() {
      describe('constructor', function() {
        it('should set the correct message', function(done) {
          var msg = 'This is a message';
          var argError = new InvalidArgumentError('name', 'value', msg);
          expect(argError.message).to.equal(msg);
          done();
        });

        it('should set the `argumentName` property', function(done) {
          var argumentName = 'some-name';
          var argError = new InvalidArgumentError(argumentName, '', '');
          expect(argError.argumentName).to.equal(argumentName);
          done();
        });

        it('should set the `argumentValue` property', function(done) {
          var argumentValue = 'some-name';
          var argError = new InvalidArgumentError('', argumentValue, '');
          expect(argError.argumentValue).to.equal(argumentValue);
          done();
        });
      }); // end 'constructor'
    }); // end 'InvalidArgumentError'
  }); // end 'errors'
}); // end 'common'
