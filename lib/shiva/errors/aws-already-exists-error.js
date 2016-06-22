'use strict'

var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Error that should be thrown when a unique name is by a model during creation
 * that already exists for the given resource type. This error extends ponos'
 * `TaskFatalError` and will cause workers to fatally error automatically.
 * @see astral:shiva:models:aws
 * @module astral:shiva:errors
 */
module.exports =
  class AWSAlreadyExistsError extends WorkerStopError {
    constructor (originalError) {
      super()
      this.data.originalError = originalError
      this.message = originalError.message
    }
}
