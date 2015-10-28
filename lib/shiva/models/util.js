'use strict';

/**
 * Model utilities for Shiva.
 * @module astral:shiva:models
 */
module.exports = class Util {
  /**
   * Execption handler that casts general AWS errors to specific classes so they
   * can be better handled by promise catch blocks in workers.
   * @param {Error} err The error to cast and re-throw.
   * @throws The error casted to a specific type (if applicable) or a general
   *   `AWSError`. If the error cannot be casted to an AWSError we directly
   *   rethrow the error.
   */
  static castAWSError (err) {
    // TODO Implement me
    throw err;
  }
};
