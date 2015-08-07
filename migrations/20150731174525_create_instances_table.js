'use strict';

/**
 * Creates the instances table for the infrastructure database.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.createTable('instances', function (table) {
    table.string('id', 36)
      .primary();
    table.string('cluster_id', 36)
      .notNullable().index();
    table.specificType('type', 'instance_type')
      .notNullable().defaultsTo('build').index();
    table.string('ami_id', 36)
      .notNullable();
    table.string('aws_type', 36)
      .notNullable().index();
    table.timestamp('created_at')
      .index().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at')
      .defaultTo(knex.raw('now()'));
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('instances');
};
