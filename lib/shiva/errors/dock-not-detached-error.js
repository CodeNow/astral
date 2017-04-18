'use strict'
const BaseError = require('error-cat/errors/base-error')

module.exports = class DockNotDetachedError extends BaseError {
  constructor (errMessage, originalError, reporting) {
    super(errMessage, originalError, reporting)
  }
}
