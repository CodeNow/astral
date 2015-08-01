'use strict';

/**
 * Creates a composite index of (ami_id, ami_version) for the instance table.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  var sql = "CREATE INDEX instances_ami ON instances (ami_id, ami_version);";
  return knex.schema.raw(sql);
};

exports.down = function(knex, Promise) {
  return knex.schema.raw('DROP INDEX instances_ami;');
};
