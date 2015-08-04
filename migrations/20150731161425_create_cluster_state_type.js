'use strict';

/**
 * Creates the cluster state type enumeration.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  var sql = [
    "CREATE TYPE cluster_state AS ENUM (",
      "'down',",
      "'provisioning',",
      "'running',",
      "'removing'",
    ")"
  ].join('');
  return knex.schema.raw(sql);
};

exports.down = function(knex, Promise) {
  return knex.schema.raw("DROP TYPE cluster_state;");
};
