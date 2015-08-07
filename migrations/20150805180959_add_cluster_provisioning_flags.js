'use strict';

/**
 * Adds the `run_provisioned` and `build_provisioned` flags to the clusters
 * table.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.table('clusters', function (table) {
    table.boolean('run_provisioned')
      .notNullable().default(false);
    table.boolean('build_provisioned')
      .notNullable().default(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('clusters', function (table) {
    table.dropColumn('run_provisioned');
    table.dropColumn('build_provisioned');
  });
};
