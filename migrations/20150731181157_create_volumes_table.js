'use strict';

/**
 * Creates the volumes (disks) table.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.createTable('volumes', function (table) {
    table.string('id', 36)
      .primary();
    table.string('cluster_id', 36)
      .notNullable().index();
    table.string('volume_type', 36)
      .notNullable();
    table.integer('size')
      .notNullable();
    table.timestamp('created_at')
      .index().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at')
      .defaultTo(knex.raw('now()'));
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('volumes');
};
