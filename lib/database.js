'use strict';

/**
 * Database connection via knex query builder.
 * @author Ryan Sandor Richards
 * @module shiva:database
 */
module.exports = require('knex')({
  client: 'pg',
  connection: process.env.POSTGRES_CONNECT_STRING
});
