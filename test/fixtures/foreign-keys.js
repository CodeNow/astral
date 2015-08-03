'use strict';

var debug = require('debug')('shiva:test:fixtures');
var db = require('database');

/**
 * Helpers for managing foreign keys when performing test databases batch
 * queries (wipes, seed data, etc).
 * @author Ryan Sandor Richards
 * @module shiva:test:fixtures
 */
module.exports = {
  remove: remove,
  add: add
};

/**
 * It is a little weird to have these constraints listed here but it is for a
 * good reason. It is best practice in postgresql to remove foreign key
 * constraints before doing things like batch updates and then re-apply them
 * when you are done.
 * @type Array
 */
var foreignKeys = [
  {
    name: 'instance_volumes_instance_id_foreign',
    table: 'instances',
    column: 'cluster_id',
    foreignTable: 'clusters',
    foreignColumn: 'id'
  },
  {
    name: 'volumes_cluster_id_foreign',
    table: 'volumes',
    column: 'cluster_id',
    foreignTable: 'clusters',
    foreignColumn: 'id'
  },
  {
    name: 'instance_volumes_instance_id_foreign',
    table: 'instance_volumes',
    column: 'instance_id',
    foreignTable: 'instances',
    foreignColumn: 'id'
  },
  {
    name: 'instance_volumes_volume_id_foreign',
    table: 'instance_volumes',
    column: 'volume_id',
    foreignTable: 'volumes',
    foreignColumn: 'id'
  }
];

/**
 * Removes all foreign keys constraints from the database.
 * @return {knex~promise} A promise for the constraint drop query.
 */
function remove() {
  var sql = foreignKeys.map(function (key) {
    return 'ALTER TABLE ' + key.table + ' DROP CONSTRAINT IF EXISTS ' + 
      key.name + ';';
  }).join('\n');
  debug(sql);
  return db.schema.raw(sql);
}

/**
 * Adds all foregin key constraints back to the database.
 * @return {knex~promise} A promise for the query.
 */
function add() {
  var sql = foreignKeys.map(function (key) {
    return 'ALTER TABLE ' + key.table + ' ADD CONSTRAINT ' + key.name +
      ' FOREIGN KEY (' + key.column + ') REFERENCES ' + key.foreignTable +
      '(' + key.foreignColumn + ');';
  }).join('\n');
  debug(sql);
  return db.schema.raw(sql);
}
