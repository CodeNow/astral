'use strict';

var db = require('../database');

/**
 * Base model for tables in the infrastructure database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = Model;

/**
 * Base model class. This class provides common functions (selects, counts, ...)
 * and should be extended by all other models in the codebase.
 *
 * Under the hood the model class uses the `knex` module to build and execute
 * queries. Almost all of the public methods return query promises that can then
 * be further extended or immediately executed.
 *
 * Important: models in shiva are _NOT_ Object Relational Mapped! Models should
 * be simple, easy-to-use, programmatic interfaces to tables/views/relations in
 * the database.
 *
 * We would like to avoid clunky ORM behaviors if possible to make the interface
 * easier to use and less confusing. Plus side: you don't have to learn a new
 * ORM, also plus side: you can actually use SQL :P
 *
 * @example
 * // How to extend model...
 * var Model = require('./model');
 * var util = require('util');
 *
 * function MyTable() {
 *   Model.call(this, 'my_table', 'id');
 * }
 * util.inherits(MyTable, Model);
 *
 * @example
 * // Using method promises inside traditional cb style methods...
 * var instance = require('./models/instance')
 *
 * function someActionOrRoute(cb) {
 *   instance.get('some-id').then(function (instance) {
 *     // Do something with the instance...
 *     // Then return some new data...
 *     cb(null, 'some data involving the instance');
 *   }).catch(cb);
 * }
 *
 * @example
 * // Select the created_at field for all instances
 * instance.select('created_at')
 *
 *   // Apply a where clause
 *   .where({ cluster_id: '1234' })
 *
 *   // Limit the query to 10 results
 *   .limit(10)
 *
 *   // Determine age of the instance by using the map function
 *   .map(function (instance) {
 *     return new Date() - new Date(instance.created_at);
 *   })
 *
 *   // Handle the results
 *   .then(function (rows) { ... })
 *   .catch(function (err) { ... });
 *
 * @class
 * @param tableName Name of the table associated with the model.
 * @param primaryKey Name of the primary key for the model.
 */
function Model(tableName, primaryKey) {
  this.table = tableName;
  this.primaryKey = primaryKey;
  this.db = db;
}

/**
 * Helper method to create a knex where clause that matches a specific value for
 * the table's primay key.
 * @param value The primary key value to match.
 * @return {Object} A where clause that when executed will match against the
 *   given primary key.
 */
Model.prototype._wherePrimaryEq = function (value) {
  var whereClause = {};
  whereClause[this.primaryKey] = value;
  return whereClause;
};

/**
 * Creates a count query over the table.
 * @param {string} [column] Optional column to count. Defaults to `*`.
 * @return {knex~promise} A knex promise for the query.
 */
Model.prototype.count = function (column) {
  return db.count().table(this.table);
};

/**
 * Alias for the `.insert()` method.
 * @see Model.insert
 */
Model.prototype.create = function (data) {
  return this.insert(data);
};

/**
 * Deletes a row with the given primary key from the database.
 * @param {string} id Primary key value for the row to remove.
 * @return {knex~promise} A knex promise for the query.
 */
Model.prototype.del = function (id) {
  return db(this.table).where(this._wherePrimaryEq(id)).del();
}

/**
 * Determines if a row with the given primary key exists in the table.
 *
 * @example
 * model.exists('another-id', function (err, exists) {
 *   // `exists` will be a boolean...
 * });
 *
 * @param {string}   id Primary key id for the row to check.
 * @param {function} cb Callback to execute with the results of the query.
 */
Model.prototype.exists = function (id, cb) {
  return this.count().where(this._wherePrimaryEq(id)).limit(1)
    .map(function (row) { return row.count > 0; })
    .reduce(function (memo, row) { return row; }, false);
};

/**
 * Retrieves a single row from the table with the given primary key.
 *
 * @example
 * model.get('some-id').then(function (row) {
 *   // Do something with the row...
 * }).catch(cb);
 *
 * @param  {string} id Primary key id for the row to retrieve.
 * @return {knex~promise} A knex promise for the query.
 */
Model.prototype.get = function (id) {
  return this.select().where(this._wherePrimaryEq(id)).limit(1)
    .reduce(function (memo, row) { return row }, null);
};

/**
 * Inserts a new row into the table.
 *
 * @example
 * // Insert a new row with name="foo" and role="bar"...
 * model.insert({ name: 'foo', role: 'bar' }).then(...);
 *
 * @param {Object} data Fields to insert into the database.
 * @return {knex~promise} A knex promise for the query.
 */
Model.prototype.insert = function (data) {
  return db(this.table).insert(data);
};

/**
 * Alias for the `.del()` method.
 * @see Model.del
 */
Model.prototype.remove = function (id) {
  return this.del(id);
};

/**
 * Performs a select on the table.
 *
 * @example
 * // Select all fields over all rows...
 * model.select().then(...);
 *
 * @example
 * // Select specific fields with a where clause
 * model.select('id', 'name').where({ cluster_id: '2233' }).then(...)
 *
 * @param {...string} field A list of fields to select from the table.
 * @return {knex~promise} A knex promise for the query.
 */
Model.prototype.select = function (/* ... */) {
  return db.select.apply(db, arguments).from(this.table);
}

/**
 * Update a single row in the table.
 *
 * @example
 * var data = { ami_id: 'ami-afe302' };
 * model.update('some-instance-id', data, function (err) {
 *   // Err will be populated if you made a mistake in your data...
 * });
 *
 * @param {string}   id Primary key id for the row to update.
 * @param {function} cb Callback to execute with the results of the update.
 */
Model.prototype.update = function (id, data) {
  return db(this.table).where(this._wherePrimaryEq(id)).update(data);
};
