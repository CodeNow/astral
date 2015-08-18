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

var instance = require('models/instance');

describe('models', function() {
  describe('Instance', function() {
    describe('constructor', function() {
      it('should set the correct table', function(done) {
        expect(instance.table).to.equal('instances');
        done();
      });

      it('should set the correct primary key', function(done) {
        expect(instance.primaryKey).to.equal('id');
        done();
      });
    }); // end 'constructor'
  }); // end 'Instance'
}); // end 'models'
