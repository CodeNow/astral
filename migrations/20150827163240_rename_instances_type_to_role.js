'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Renames `type` to `role` (default: 'run' to 'dock') on the `instances` table.
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var alterTable = knex.schema.raw([
    'ALTER TABLE instances RENAME COLUMN type TO role;',
    "ALTER TABLE instances ALTER COLUMN role SET DEFAULT 'dock';"
  ].join('\n'))
  debug(alterTable.toString())
  return alterTable
}

exports.down = function (knex, Promise) {
  var alterTable = knex.schema.raw([
    "ALTER TABLE instances ALTER COLUMN role SET DEFAULT 'run';",
    'ALTER TABLE instances RENAME COLUMN role TO type;'
  ].join('\n'))
  debug(alterTable.toString())
  return alterTable
}
