'use strict'

var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Error that should be thrown when AWS request rate limit is hit
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports =
  class AWSDeleteConflictError extends WorkerStopError {
    constructor (originalError, data) {
      super(originalError, data)
      this.data.originalError = originalError
      this.message = originalError.message
    }
}
