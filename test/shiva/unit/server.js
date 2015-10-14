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

var ponos = require('ponos');
var server = require('server');
var ErrorCat = require('error-cat');

describe('server', function() {
  describe('getInstance', function() {
    it('should return a server instance', function(done) {
      expect(server.getInstance()).to.be.an.instanceof(ponos.Server);
      done();
    });

    it('should return a singelton instance', function(done) {
      var s = server.getInstance();
      expect(server.getInstance()).to.equal(s);
      done();
    });
  });
}); // end 'server'
