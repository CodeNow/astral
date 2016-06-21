'use strict'

var debug = require('debug')('shiva:migration')

/**
 * Creates the `github_events` table. This table is records all incoming github
 * events that occur for each organization using runnable. These events can then
 * be used for internal data-mining (load predictions in specific).
 * @author Ryan Sandor Richards
 */

var tableName = 'github_events'
var indexName = [tableName, '_payload_jsonb_path_ops'].join('')

exports.up = function (knex, Promise) {
  var createIndex = knex.schema.raw([
    'CREATE INDEX', indexName, 'ON', tableName,
    'USING gin(payload jsonb_path_ops);'
  ].join(' '))
  debug(createIndex.toString())
  return createIndex
}

exports.down = function (knex, Promise) {
  var dropIndex = knex.schema.raw(['DROP INDEX', indexName].join(' '))
  debug(dropIndex.toString())
  return dropIndex
}
