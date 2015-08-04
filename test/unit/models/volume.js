'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

require('loadenv')('shiva:test');

var noop = require('101/noop');
var volume = require('models/volume');

describe('models', function() {
  describe('Volume', function() {
    describe('constructor', function() {
      it('should set the correct table', function(done) {
        expect(volume.table).to.equal('volumes');
        done();
      });

      it('should set the correct primary key', function(done) {
        expect(volume.primaryKey).to.equal('id');
        done();
      });
    }); // end 'constructor'

    describe('getInstances', function() {
      it('should return a promise', function(done) {
        expect(volume.getInstances('1').then).to.be.a.function();
        done();
      });
    }); // end 'getInstances'
  }); // end 'Volume'
}); // end 'models'
