'use strict';

var debug = require('debug')('shiva:migration');

/**
 * Creates the instances table for the infrastructure database.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  var createTable = knex.schema.createTable('instances', function (table) {
    table.string('id', 36)
      .primary();
    table.string('cluster_id', 36)
      .notNullable().index();
    table.string('type')
      .notNullable().defaultsTo('run').index();
    table.string('ami_id', 36)
      .notNullable();
    table.string('aws_type', 36)
      .notNullable().index();
    table.timestamp('created_at')
      .index().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at')
      .defaultTo(knex.raw('now()'));
  });
  debug(createTable.toString());
  return createTable;
};

exports.down = function(knex, Promise) {
  var dropTable = knex.schema.dropTable('instances');
  debug(dropTable.toString());
  return dropTable;
};
