'use strict';

var DatabaseError = require('./database-error');

/**
 * Error thrown when a uniqueness constraint is violated during a database
 * insert.
 * @module astral:common:errors
 */
module.exports = class UniqueError extends DatabaseError {
  /**
   * @see astral:common:errors:database-error
   */
  constructor (err) {
    super(err);
  }
}
