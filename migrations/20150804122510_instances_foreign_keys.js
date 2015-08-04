'use strict';

/**
 * Adds foreign key relating instances table to the clusters table. Note we
 * do this in pure postgres to ensure we have a consistent name for the
 * constraint.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.raw([
    'ALTER TABLE instances ADD CONSTRAINT instances_to_clusters',
    'FOREIGN KEY (cluster_id) REFERENCES clusters(id);'
  ].join(' '));
};

exports.down = function(knex, Promise) {
  return knex.schema.raw('ALTER TABLE instances DROP CONSTRAINT instances_to_clusters;');
};
