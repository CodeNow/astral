'use strict';

/**
 * Rename `clusters.subnet` to `cluster.subnet_id`
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.raw(
    "ALTER TABLE clusters RENAME COLUMN subnet TO subnet_id;"
  );
};

exports.down = function(knex, Promise) {
  return knex.schema.raw(
    "ALTER TABLE clusters RENAME COLUMN subnet_id TO subnet;"
  );
};
