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
      .notNullable().index().references('clusters.id');
    table.specificType('type', 'instance_type')
      .notNullable().defaultsTo('build').index();
    table.string('ami_id', 36)
      .notNullable();
    table.string('ami_version', 15)
      .notNullable();
    table.string('aws_type', 36)
      .notNullable().index();
    table.integer('ram')
      .notNullable();
    table.integer('cpu')
      .notNullable();
    table.timestamp('created_at')
      .index();
    table.timestamp('updated_at');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('instances');
};
