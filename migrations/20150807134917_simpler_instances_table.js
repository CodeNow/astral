'use strict';

/**
 * Drop a few fields from the instances table to make it easier to work with.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  return knex.schema.raw([
    "ALTER TABLE instances DROP COLUMN ami_version;",
    "ALTER TABLE instances DROP COLUMN ram;",
    "ALTER TABLE instances DROP COLUMN cpu;"
  ].join('\n'));
};

exports.down = function(knex, Promise) {
  return knex.schema.raw([
    "ALTER TABLE instances ADD COLUMN ami_version character varying(15) NOT NULL;",
    "ALTER TABLE instances ADD COLUMN ram integer NOT NULL;",
    "ALTER TABLE instances ADD COLUMN cpu integer NOT NULL;"
  ].join('\n'));
};
