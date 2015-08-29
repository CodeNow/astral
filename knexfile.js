// Update with your config settings.

require('loadenv')('shiva:env');

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.POSTGRES_CONNECT_STRING
  },

  test: {
    client: 'pg',
    connection: process.env.POSTGRES_CONNECT_STRING
  },

  'production-beta': {
    client: 'pg',
    connection: process.env.POSTGRES_CONNECT_STRING,
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
    client: 'pg',
    connection: process.env.POSTGRES_CONNECT_STRING,
    pool: {
      min: 2,
      max: 10
    }
  }
};
