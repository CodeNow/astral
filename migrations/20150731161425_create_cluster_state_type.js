'use strict';

/**
 * Creates the cluster state type enumeration.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.raw(
    "CREATE TYPE cluster_state AS ENUM ('down', 'provisioning', 'up');"
  );
};

exports.down = function(knex, Promise) {
  return knex.schema.raw("DROP TYPE cluster_state;");
};
