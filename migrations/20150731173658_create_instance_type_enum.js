'use strict';

/**
 * Creates the instance type enumeration.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  var sql = [
    "CREATE TYPE instance_type AS ENUM (",
      "'build',",
      "'run',",
      "'service'",
    ")"
  ].join('');
  return knex.schema.raw(sql);
};

exports.down = function(knex, Promise) {
  return knex.schema.raw("DROP TYPE instance_type;");
};
