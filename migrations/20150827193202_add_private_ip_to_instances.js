'use strict';

var debug = require('debug')('shiva:migration');

/**
 * Adds a new field named `aws_private_ip_address` to the instances table.
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  var updateTable = knex.schema.table('instances', function (table) {
    table.string('aws_private_ip_address', 15).notNullable();
  });
  debug(updateTable.toString());
  return updateTable;
};

exports.down = function(knex, Promise) {
  var updateTable = knex.schema.table('instances', function (table) {
    table.dropColumn('aws_private_ip_address');
  });
  debug(updateTable.toString());
  return updateTable;
};
