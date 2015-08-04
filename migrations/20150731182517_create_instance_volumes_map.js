'use strict';

/**
 * Creates the mapping table for instances and volumes in a cluster.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.createTable('instance_volumes', function (table) {
    table.string('instance_id', 36);
    table.string('volume_id', 36);
    table.timestamp('created_at')
      .index().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at')
      .defaultTo(knex.raw('now()'));
    table.primary(['instance_id', 'volume_id']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('instance_volumes');
};
