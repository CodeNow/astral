'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Adds a new field named `deleted` to the instances table. This is used for
 * soft deletes.
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var updateTable = knex.schema.table('instances', function (table) {
    table.timestamp('deleted').defaultTo(null)
  })
  debug(updateTable.toString())
  return updateTable
}

exports.down = function (knex, Promise) {
  var updateTable = knex.schema.table('instances', function (table) {
    table.dropColumn('deleted')
  })
  debug(updateTable.toString())
  return updateTable
}
