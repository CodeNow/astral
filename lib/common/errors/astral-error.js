'use strict'

/**
 * Base Error class for Astral. All custom errors should extend from this as it
 * handles the setup for the name, message, and stack trace.
 * @module astral:common:errors
 */
module.exports =
  class AstralError extends Error {
    constructor (message) {
      super()
      this.message = message
      this.name = this.constructor.name
      Error.captureStackTrace(this, this.constructor.name)
    }
}
