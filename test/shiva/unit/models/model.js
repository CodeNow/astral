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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var db = require(process.env.ASTRAL_ROOT + 'common/database');
var Model = require(process.env.ASTRAL_ROOT + 'shiva/models/model');

describe('shiva', function() {
  describe('models', function () {
    describe('Model', function() {
      var table = 'model_test';
      var primaryKey = 'id';
      var model;
      var columnNames = ['id', 'name', 'quantity'];

      before(function (done) {
        db.schema.dropTableIfExists(table).asCallback(done);
      });

      before(function (done) {
        db.schema.createTable(table, function (table) {
          table.string('id').primary();
          table.string('name');
          table.integer('quantity');
          table.timestamp('created_at').index().defaultTo(db.raw('now()'));
          table.timestamp('updated_at').defaultTo(db.raw('now()'));
        }).asCallback(done);
      });

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
        var mock = {
          where: function () { return mock; },
          limit: function () { return mock; },
          then: function () { return mock; }
        };

        beforeEach(function (done) {
          sinon.spy(model, '_wherePrimaryEq');
          sinon.stub(model, 'select').returns(mock);
          sinon.spy(mock, 'where');
          sinon.spy(mock, 'limit');
          sinon.spy(mock, 'then');
          done();
        });

        afterEach(function (done) {
          model._wherePrimaryEq.restore();
          model.select.restore();
          mock.where.restore();
          mock.limit.restore();
          mock.then.restore();
          done();
        });

        it('should use the correct where clause', function(done) {
          var id = 'some-id';
          model.get(id);
          expect(model._wherePrimaryEq.calledWith(id)).to.be.true();
          done();
        });

        it('should limit the result set to a single row', function(done) {
          model.get('wowza');
          expect(mock.limit.calledWith(1)).to.be.true();
          done();
        });

        it('should return null if no such row exists', function(done) {
          model.get('whatever');
          expect(mock.then.calledOnce).to.be.true();
          expect(mock.then.firstCall.args[0]).to.be.a.function();
          var thenFunction = mock.then.firstCall.args[0];
          expect(thenFunction([])).to.equal(null);
          done();
        });

        it('should return the resulting row', function(done) {
          model.get('whatever');
          expect(mock.then.calledOnce).to.be.true();
          expect(mock.then.firstCall.args[0]).to.be.a.function();
          var thenFunction = mock.then.firstCall.args[0];
          var row = { foo: 'bar' };
          expect(thenFunction([row])).to.deep.equal(row);
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
            where: function (query) {
              expect(query.id).to.equal('1');
              expect(Object.keys(query).length).to.equal(1);
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
}); // end 'shiva'
