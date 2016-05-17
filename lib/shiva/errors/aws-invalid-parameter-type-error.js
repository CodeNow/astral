'use strict'

var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Error thrown when a parameter that is sent to AWS is of an invalid type.
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports =
  class AWSInvalidParameterTypeError extends WorkerStopError {
    constructor (originalError) {
      super()
      this.data.originalError = originalError
      this.message = originalError.message
    }
}
