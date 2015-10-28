'use strict';

var defaults = require('101/defaults');

/**
 * Example fields expected on a knex error.
 * @type {object}
 */
const ERROR_FIELDS = {
  name: 'error',
  length: 206,
  severity: 'ERROR',
  code: '23505',
  detail: 'Key (delivery_id)=(a) already exists.',
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: 'public',
  table: 'github_events',
  column: undefined,
  dataType: undefined,
  constraint: 'github_events_pkey',
  file: 'nbtinsert.c',
  line: '406',
  routine: '_bt_check_unique'
};

/**
 * Creates a new knex error fixture with the given code.
 * @param [code] Optional specific code to pass.
 * @return {Error} a vanilla knex error with the given code.
 * @module astral:test:common:fixtures
 */
module.exports = function createKnexError(code) {
  var knexError = new Error();
  defaults(knexError, ERROR_FIELDS);
  if (code) {
    knexError.code = code;
  }
  return knexError;
}
