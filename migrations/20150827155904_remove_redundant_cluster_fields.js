'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Removes the following fields from the cluster table:
 *
 * - security_group_id
 * - subnet_id
 * - ssh_key_name
 *
 * At design time it was not clear if these values would need to be mutable on
 * a per cluster basis. While it would be advantageous in the future to keep
 * these fields coupled to a particular cluster instance, it will not be
 * needed until we allow private infrastructures.
 *
 * Once they are needed we can easily introduce them back into the data model.
 * By removing them now it keeps the model as lean as possible and easy to work
 * with.
 *
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var updateTable = knex.schema.table('clusters', function (table) {
    table.dropColumn('security_group_id')
    table.dropColumn('subnet_id')
    table.dropColumn('ssh_key_name')
  })
  debug(updateTable.toString())
  return updateTable
}

exports.down = function (knex, Promise) {
  var updateTable = knex.schema.table('clusters', function (table) {
    table.string('security_group_id', 36)
      .notNullable()
    table.string('subnet_id', 36)
      .notNullable()
    table.string('ssh_key_name', 36)
      .notNullable()
  })
  debug(updateTable.toString())
  return updateTable
}
