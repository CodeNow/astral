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

var db = require('database');
var Model = require('models/model');

describe('models', function () {
  describe('Model', function() {
    var table = 'model_test';
    var primaryKey = 'id';
    var model;
    var columnNames = ['id', 'name', 'quantity'];

    beforeEach(function (done) {
      model = new Model(table, primaryKey);
      done();
    });

    describe('constructor', function() {
      it('should set the table name', function(done) {
        expect(model.table).to.equal(table);
        done();
      });

      it('should set the primary key', function(done) {
        expect(model.primaryKey).to.equal(primaryKey);
        done();
      });

      it('should set a reference to the db driver', function(done) {
        expect(model.db).to.equal(db);
        done();
      });
    }); // end 'constructor'

    describe('_wherePrimaryEq', function() {
      it('should construct the correct where clause', function(done) {
        expect(model._wherePrimaryEq('foo')).to.deep.equal({ id: 'foo' });
        done();
      });
    }); // end '_wherePrimaryEq'

    describe('count', function() {
      it('should return a promise', function(done) {
        var promise = model.count();
        expect(promise.then).to.be.a.function();
        done();
      });
    }); // end 'count'

    describe('create', function() {
      it('should be an alias for `insert`', function(done) {
        var row = { id: '2' };
        sinon.spy(model, 'insert');
        model.create(row);
        expect(model.insert.calledWith(row)).to.be.true();
        model.insert.restore();
        done();
      });
    }); // end 'create'

    describe('del', function() {
      it('should return a promise', function(done) {
        expect(model.del('22').then).to.be.a.function();
        done();
      });
    }); // end 'del'

    describe('exists', function() {
      it('should return a promise', function(done) {
        expect(model.exists('snkns').then).to.be.a.function();
        done();
      });
    }); // end 'exists'

    describe('get', function() {
      it('should return a promise', function(done) {
        expect(model.get('someid').then).to.be.a.function();
        done();
      });
    }); // end 'get'

    describe('insert', function() {
      it('should return a promise', function(done) {
        expect(model.insert({ id: 'wow' }).then).to.be.a.function();
        done();
      });
    }); // end 'insert'

    describe('remove', function() {
      it('should be an alias for `del`', function(done) {
        var id = '23dnkns';
        sinon.spy(model, 'del');
        model.remove(id).then(function () {
          expect(model.del.calledWith(id)).to.be.true();
          model.del.restore();
          done();
        }).catch(done);
      });
    }); // end 'remove'

    describe('select', function() {
      it('should return a promise', function(done) {
        expect(model.select().then).to.be.a.function();
        done();
      });
    }); // end 'select'

    describe('update', function() {
      it('should return a promise', function(done) {
        expect(model.update('1', { name: 'woo'}).then).to.be.a.function();
        done();
      });

      it('should set the `updated_at` field', function(done) {
        sinon.stub(model, 'db').returns({
          where: function () {
            return {
              update: function (data) {
                expect(data.updated_at).to.exist();
                expect(data.updated_at.sql).to.equal('now()');
                model.db.restore();
                done();
              }
            };
          }
        });
        model.update('1', { name: 'wow' });
      });
    }); // end 'update'
  }); // end 'Model'
}); // end 'models'
