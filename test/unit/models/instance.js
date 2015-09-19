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
    describe('#softDelete', function() {
      it('should return a promise', function(done) {
        expect(instance.softDelete('1').then).to.be.a.function();
        done();
      });
      it('should set the `deleted` field', function(done) {
        sinon.stub(instance, 'db').returns({
          where: function (query) {
            expect(query.id).to.equal('1');
            expect(Object.keys(query).length).to.equal(1);
            return {
              whereNotNull: function (key) {
                expect(key).to.equal('deleted');
                return {
                  update: function (data) {
                    expect(data.deleted).to.exist();
                    expect(data.deleted.sql).to.equal('now()');
                    instance.db.restore();
                    done();
                  }
                };
              }
            };
          }
        });
        instance.softDelete('1');
      });
    }); // end '#softDelete'
  }); // end 'Instance'
}); // end 'models'
