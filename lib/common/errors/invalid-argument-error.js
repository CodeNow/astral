'use strict';

var AstralError = require('./astral-error');

/**
 * Error that is thrown by models when they encounter an invalid argument. This
 * can be used to handle validation easily from within models in pull it out of
 * workers where appropriate.
 * @module astral:common:errors
 */
module.exports = class InvalidArgumentError extends AstralError {
  /**
   * Creates a new InvalidArgumentError.
   * @param {string} name Name of the argument.
   * @param value Value provided.
   * @param {string} message Information about why the argument was invalid.
   */
  constructor(name, value, message) {
    super(message);
    this.argumentName = name;
    this.argumentValue = value;
  }
};
