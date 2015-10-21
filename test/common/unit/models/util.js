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
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/common/fixtures/astral-require');

require('loadenv')({ debugName: 'astral:test' });

var Util = astralRequire('common/models/util');
var DatabaseError = astralRequire('common/errors/database-error');
var NotNullError = astralRequire('common/errors/not-null-error');
var ForeignKeyError = astralRequire('common/errors/foreign-key-error');
var UniqueError = astralRequire('common/errors/unique-error');

var createKnexError = require('../../fixtures/knex-error');

describe('common', function() {
  describe('models', function() {
    describe('Util', function() {
      describe('castDatabaseError', function() {
        it('should directly rethrow errors without a code', function(done) {
          var vanillaError = new Error();
          try {
            Util.castDatabaseError(vanillaError)
          }
          catch (e) {
            expect(e).to.equal(vanillaError);
          }
          done();
        });

        it('should directly rethrow errors with a non-string code', function(done) {
          var invalidCode = createKnexError(123);
          try {
            Util.castDatabaseError(invalidCode)
          }
          catch (e) {
            expect(e).to.equal(invalidCode);
          }
          done();
        });

        it('should directly rethrow errors with an invalid code length', function(done) {
          var invalidCode = createKnexError('12345678');
          try {
            Util.castDatabaseError(invalidCode)
          }
          catch (e) {
            expect(e).to.equal(invalidCode);
          }
          done();
        });

        it('should cast to a database error by default', function(done) {
          expect(function () {
            Util.castDatabaseError(createKnexError('abcde'))
          }).to.throw(DatabaseError);
          done();
        });

        it('should correctly cast to ForeignKeyError', function(done) {
          expect(function () {
            Util.castDatabaseError(createKnexError('23503'))
          }).to.throw(ForeignKeyError);
          done();
        });

        it('should correctly cast to NotNullError', function(done) {
          expect(function () {
            Util.castDatabaseError(createKnexError('23502'))
          }).to.throw(NotNullError);
          done();
        });

        it('should correctly cast to UniqueError', function(done) {
          expect(function () {
            Util.castDatabaseError(createKnexError('23505'))
          }).to.throw(UniqueError);
          done();
        });
      }); // end 'castDatabaseError'
    }); // end 'Util'
  }); // end 'models'
}); // end 'common'
