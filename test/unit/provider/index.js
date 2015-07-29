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
var providers = require('providers');
var Provider = require('providers/provider');

describe('providers', function() {
  describe('getProvider', function() {
    it('should return a provider adapter', function(done) {
      expect(providers.getProvider()).instanceof(Provider);
      done();
    });
  });
});
