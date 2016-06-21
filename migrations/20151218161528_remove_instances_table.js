'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Removes the instances table from postgres.
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var dropTable = knex.schema.raw('DROP TABLE instances;')
  debug(dropTable.toString())
  return dropTable
}

exports.down = function (knex, Promise) {
  throw new Error('Cannot revert this migration')
}
