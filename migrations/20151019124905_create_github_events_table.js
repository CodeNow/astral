'use strict';

var debug = require('debug')('shiva:migration');

/**
 * Creates the `github_events` table. This table is records all incoming github
 * events that occur for each organization using runnable. These events can then
 * be used for internal data-mining (load predictions in specific).
 * @author Ryan Sandor Richards
 */

var tableName = 'github_events';

exports.up = function(knex, Promise) {
  var createTable = knex.schema.createTable(tableName, function (table) {
    table.string('delivery_id', 64)
      .primary();
    table.string('type', 64)
      .notNullable().index();
    table.bigInteger('github_org_id')
      .notNullable().index();
    table.timestamp('recorded_at')
      .notNullable().index();
    table.json('payload', true)
      .notNullable();
  });
  debug(createTable.toString());
  return createTable;
};

exports.down = function(knex, Promise) {
  var dropTable = knex.schema.dropTable(tableName);
  debug(dropTable.toString());
  return dropTable;
};
