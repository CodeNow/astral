'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Adds a new field named `githubId` to the clusters table that holds the id
 * of the github user/organization associated with the cluster.
 *
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var updateTable = knex.schema.table('clusters', function (table) {
    table.string('github_id', 36).unique().notNullable()
  })
  debug(updateTable.toString())
  return updateTable
}

exports.down = function (knex, Promise) {
  var updateTable = knex.schema.table('clusters', function (table) {
    table.dropColumn('github_id')
  })
  debug(updateTable.toString())
  return updateTable
}
