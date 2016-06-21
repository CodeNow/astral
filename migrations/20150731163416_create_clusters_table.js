'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Creates the clusters table for the infrastructure database.
 * @author Ryan Sandor Richards
 */

exports.up = function (knex, Promise) {
  var createTable = knex.schema.createTable('clusters', function (table) {
    table.string('id', 36)
      .primary()
    table.string('security_group_id', 36)
      .notNullable()
    table.string('subnet_id', 36)
      .notNullable()
    table.string('ssh_key_name', 36)
      .notNullable()
    table.timestamp('created_at')
      .index().defaultTo(knex.raw('now()'))
    table.timestamp('updated_at')
      .defaultTo(knex.raw('now()'))
  })
  debug(createTable.toString())
  return createTable
}

exports.down = function (knex, Promise) {
  var dropTable = knex.schema.dropTable('clusters')
  debug(dropTable.toString())
  return dropTable
}
