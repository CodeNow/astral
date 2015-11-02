'use strict';

var AstralError = require('../../common/errors/astral-error');

/**
 * Error that should be thrown when an AWS adapter is missing a method. This
 * happens when we white-list promisify specific methods on adapters.
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports = class AWSMethodMissingError extends AstralError {
  /**
   * Creates the new error.
   * @param {string} className Name of the aws-sdk class being used.
   * @param {string} method Name of the method to be called.
   */
  constructor (className, method) {
    super(`aws-sdk adatper ${className} missing method ${method}`);
    this.awsClassName = className;
    this.awsMethod = method;
  }
};
