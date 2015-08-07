'use strict';

/**
 * Adds foreign key relating the instance_volumes table to the instances table.
 * Note we do this in pure postgres to ensure we have a consistent name for the
 * constraint.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.raw([
    'ALTER TABLE instance_volumes ADD CONSTRAINT instance_volumes_to_instances',
    'FOREIGN KEY (instance_id) REFERENCES instances(id);'
  ].join(' '));
};

exports.down = function(knex, Promise) {
  return knex.schema.raw('ALTER TABLE instance_volumes DROP CONSTRAINT instance_volumes_to_instances;');
};
