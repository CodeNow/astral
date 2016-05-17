'use strict'

var TaskFatalError = require('ponos').TaskFatalError

/**
 * Error thrown when a parameter that is sent to AWS is of an invalid type.
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports =
  class AWSInvalidParameterTypeError extends TaskFatalError {
    constructor (originalError) {
      super()
      this.data.originalError = originalError
      this.message = originalError.message
    }
}
