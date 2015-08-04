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

describe('functional', function() {
  describe('models', function() {
    var table = 'model_test';
    var primaryKey = 'id';
    var model;
    var columnNames = ['id', 'name', 'quantity'];

    describe('Model', function() {
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
        db('model_test').truncate().asCallback(done);
      });

      describe('count', function() {
        it('should correctly query to find zero records', function(done) {
          model.count().then(function (result) {
            expect(result).to.be.an.array();
            expect(result.length).to.equal(1);
            expect(result[0].count).to.equal("0");
            done();
          }).catch(done);
        });

        it('should correctly query to find one record', function(done) {
          db(table).insert({ id: '1', name: 'hello' }).then(function () {
            return model.count();
          }).then(function (result) {
            expect(result[0].count).to.equal("1");
            done();
          }).catch(done);
        });
      }); // end 'count'

      describe('del', function() {
        var rowId = '33';
        beforeEach(function (done) {
          db(table).insert({ id: rowId }).asCallback(done);
        });

        it('should correctly delete an non-existant record', function(done) {
          model.del('nothere').then(function (deleted) {
            expect(deleted).to.equal(0);
            done();
          });
        });

        it('should correctly delete a record', function(done) {
          model.del(rowId).then(function(deleted) {
            expect(deleted).to.equal(1);
            done();
          }).catch(done);
        });
      }); // end 'del'

      describe('exists', function() {
        var rowId = 'randomid';
        beforeEach(function (done) {
          db(table).insert({ id: rowId }).asCallback(done);
        });

        it('should correctly identify a missing row id', function(done) {
          model.exists('not-there').then(function (isThere) {
            expect(isThere).to.be.false();
            done();
          }).catch(done);
        });

        it('should correctly identify an existing row id', function(done) {
          model.exists(rowId).then(function (isThere) {
            expect(isThere).to.be.true();
            done();
          }).catch(done);
        });
      }); // end 'exists'

      describe('get', function() {
        var rowId = 'yayanid';
        var row = { id: rowId, name: 'name', quantity: 627 }
        beforeEach(function (done) {
          db(table).insert(row).asCallback(done);
        });

        it('should correctly find an existing row', function(done) {
          model.get(rowId).then(function (result) {
            // Unsure why we cannot use deepequals here, but it doesn't work...
            expect(result.id).to.equal(row.id);
            expect(result.name).to.equal(row.name);
            expect(result.quantity).to.equal(row.quantity);
            done();
          }).catch(done);
        });
      }); // end 'get'

      describe('insert', function() {
        it('should correctly insert a row into the table', function(done) {
          var row = { id: 'wow', name: 'neat', quantity: 20030 };
          model.insert(row).then(function () {
            return model.exists(row.id)
          }).then(function (isThere) {
            expect(isThere).to.be.true();
            done();
          }).catch(done);
        });
      }); // end 'insert'

      describe('select', function() {
        var rows = [
          { id: '1', name: 'one', quantity: 100 },
          { id: '2', name: 'two', quantity: 200 },
          { id: '3', name: 'three', quantity: 300 }
        ];

        beforeEach(function (done) {
          db(table).insert(rows).asCallback(done);
        });

        it('should correctly select all fields', function(done) {
          model.select().then(function (results) {
            results.forEach(function (result, index) {
              columnNames.forEach(function (name) {
                expect(result[name]).to.equal(rows[index][name]);
              });
            });
            done();
          }).catch(done);
        });

        it('should correctly select given fields', function(done) {
          model.select('quantity').then(function (results) {
            results.forEach(function (result) {
              expect(result.quantity).to.exist();
              expect(result.id).to.not.exist();
              expect(result.name).to.not.exist();
            });
            done();
          }).catch(done);
        });
      }); // end 'select'

      describe('update', function() {
        var rowId = 'snknsk';

        beforeEach(function (done) {
          db(table).insert({
            id: rowId,
            name: 'super',
            quantity: 12
          }).asCallback(done);
        });

        it('should update existing data', function(done) {
          var updates = {
            name: 'awesome',
            quantity: 2092092
          };
          model.update(rowId, updates).then(function () {
            return model.get(rowId);
          }).then(function (row) {
            expect(row.name).to.equal(updates.name);
            expect(row.quantity).to.equal(updates.quantity);
            done();
          }).catch(done);
        });
      }); // end 'update'
    }); // end 'Model'
  }); // end 'models'

}); // end 'functional'
