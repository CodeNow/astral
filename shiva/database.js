'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

/**
 * Database connection via knex query builder.
 * @author Ryan Sandor Richards
 * @module shiva:database
 */
module.exports = require('knex')({
  client: 'pg',
  connection: process.env.POSTGRES_CONNECT_STRING,
  pool: {
    min: process.env.POSTGRES_POOL_MIN,
    max: process.env.POSTGRES_POOL_MAX
  }
});
