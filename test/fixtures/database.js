'use strict';

require('loadenv')({ debugName: 'astral:common:test' });
var db = require(process.env.ASTRAL_ROOT + 'common/database');

/**
 * Helpers for setting up the database during functional tests.
 * @author Ryan Sandor Richards
 * @module shiva:test:fixtures
 */
module.exports = {
  /**
   * Truncates all tables in the database.
   * @param cb Callback to execute after each table has been truncated.
   */
  truncate: function truncate(cb) {
    db('github_events').truncate().asCallback(cb);
  }
};
