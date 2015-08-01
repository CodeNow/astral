'use strict';

/**
 * Creates the mapping table for instances and volumes in a cluster.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.createTable('instance_volumes', function (table) {
    table.string('instance_id', 36)
      .references('instances.id');
    table.string('volume_id', 36)
      .references('volumes.id');
    // Don't need indices for the map, just use .timestamps()
    table.timestamps();
    // You cannot add a volume to an instance more than once
    table.primary(['instance_id', 'volume_id']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('instance_volumes');
};
