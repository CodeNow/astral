'use strict';

var TaskFatalError = require('ponos').TaskFatalError;

/**
 * This error is thrown any time we give a method in the AWS SDK invalid data.
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports = class AWSValidationError extends TaskFatalError {
  constructor (originalError) {
    super();
    this.data.originalError = originalError;
    this.message = originalError.message;
  }
};
