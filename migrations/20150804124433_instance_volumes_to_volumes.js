'use strict';

/**
 * Adds foreign key relating the instance_volumes table to the volumes table.
 * Note we do this in pure postgres to ensure we have a consistent name for the
 * constraint.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.raw([
    'ALTER TABLE instance_volumes ADD CONSTRAINT instance_volumes_to_volumes',
    'FOREIGN KEY (volume_id) REFERENCES volumes(id);'
  ].join(' '));
};

exports.down = function(knex, Promise) {
  return knex.schema.raw('ALTER TABLE instance_volumes DROP CONSTRAINT instance_volumes_to_volumes;');
};
