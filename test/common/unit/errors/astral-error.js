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

describe('common', function() {
  describe('errors', function() {
    describe('AstralError', function() {
      // body...
    }); // end 'AstralError'
  }); // end 'errors'
}); // end 'common'
