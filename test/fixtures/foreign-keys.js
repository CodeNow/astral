'use strict';

var debug = require('debug')('shiva:test:fixtures');
var db = require('database');

/**
 * Helpers for managing foreign keys when performing test databases batch
 * queries (migrations, wipes, seed data, etc).
 * @author Ryan Sandor Richards
 * @module shiva:test:fixtures
 */
module.exports = {
  removeKey: removeKey,
  remove: remove,
  addKey: addKey,
  add: add
};

/**
 * It is a little weird to have these constraints listed here but it is for a
 * good reason. It is best practice in postgresql to remove foreign key
 * constraints before doing things like batch updates and then re-apply them
 * when you are done.
 * @type Array
 */
var foreignKeys = {
  'instances_to_clusters': {
    table: 'instances',
    column: 'cluster_id',
    foreignTable: 'clusters',
    foreignColumn: 'id'
  }
};

/**
 * Constructs a query to remove a foreign key with the given name.
 * @param {string} name Name of the key to remove.
 * @return {string} The SQL query to remove the key, or null of a key with the
 *   given name does not exist.
 */
function removeKey(name) {
  var key = foreignKeys[name];
  if (!key) { return null; }
  return [
    'ALTER TABLE', key.table, 'DROP CONSTRAINT', name, ';'
  ].join(' ');
}

/**
 * Removes all foreign keys constraints from the database.
 * @return {knex~promise} A promise for the constraint drop query.
 */
function remove() {
  var sql = Object.keys(foreignKeys).map(function (name) {
    return removeKey(name);
  }).join('\n');
  debug(sql);
  return db.schema.raw(sql);
}

/**
 * Constructs a query to add a foreign key with the given name.
 * @param {string} name Name of the key to add.
 * @return {string} The SQL query to add the key, of null if no such key exists.
 */
function addKey(name) {
  var key = foreignKeys[name];
  if (!key) { return null; }
  return [
    'ALTER TABLE', key.table, 'ADD CONSTRAINT', name,
    'FOREIGN KEY (' + key.column + ') REFERENCES',
    key.foreignTable, '(' + key.foreignColumn + ');'
  ].join(' ');
}

/**
 * Adds all foregin key constraints back to the database.
 * @return {knex~promise} A promise for the query.
 */
function add() {
  var sql = Object.keys(foreignKeys).map(function (name) {
    return addKey(name);
  }).join('\n');
  debug(sql);
  return db.schema.raw(sql);
}
