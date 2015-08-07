'use strict';

/**
 * Creates the clusters table for the infrastructure database.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.createTable('clusters', function (table) {
    table.string('id', 36)
      .primary();
    table.string('security_group_id', 36)
      .notNullable();
    table.string('subnet', 20)
      .notNullable();
    table.string('ssh_key_name', 40)
      .notNullable();
    table.timestamp('created_at')
      .index().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at')
      .defaultTo(knex.raw('now()'));
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('clusters');
};
