'use strict';

var debug = require('debug')('shiva:migration');

/**
 * Renames the following fields on the `instances` table:
 *
 * - `ami_id`   to `aws_image_id`
 * - `aws_type` to `aws_instance_type`
 *
 * @author Ryan Sandor Richards
 */

exports.up = function(knex, Promise) {
  var updateTable = knex.schema.table('instances', function (table) {
    table.renameColumn('ami_id', 'aws_image_id');
    table.renameColumn('aws_type', 'aws_instance_type');
  });
  debug(updateTable.toString());
  return updateTable;
};

exports.down = function(knex, Promise) {
  var updateTable = knex.schema.table('instances', function (table) {
    table.renameColumn('aws_image_id', 'ami_id');
    table.renameColumn('aws_instance_type', 'aws_type');
  });
  debug(updateTable.toString());
  return updateTable;
};
