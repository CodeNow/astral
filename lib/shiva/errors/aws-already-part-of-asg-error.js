'use strict'
const BaseError = require('error-cat/errors/base-error')

module.exports = class AWSAlreadyExistsError extends BaseError {
  constructor (originalError) {
    super()
    this.data.originalError = originalError
    this.message = originalError.message
    this.currentASG = originalError.message.split(':')[2]
  }

  getCurrentASG () {
    return this.currentASG
  }
}
