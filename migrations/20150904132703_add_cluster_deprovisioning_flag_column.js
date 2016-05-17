'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Adds a new field named `deprovisioning` to the clusters table. This is used
 * to determine when a cluster is being deprovisioned.
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var updateTable = knex.schema.table('clusters', function (table) {
    table.boolean('deprovisioning').defaultTo(false)
  })
  debug(updateTable.toString())
  return updateTable
}

exports.down = function (knex, Promise) {
  var updateTable = knex.schema.table('clusters', function (table) {
    table.dropColumn('deprovisioning')
  })
  debug(updateTable.toString())
  return updateTable
}
