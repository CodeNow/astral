'use strict'

var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * This error is thrown any time we give a method in the AWS SDK invalid data.
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports =
  class AWSValidationError extends WorkerStopError {
    constructor (originalError, data) {
      super(originalError, data)
      this.data.originalError = originalError
      this.message = originalError.message
    }
}
