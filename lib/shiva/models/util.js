'use strict'

const AWSAlreadyExistsError = require('../errors/aws-already-exists-error')
const AWSAlreadyPartOfASGError = require('../errors/aws-already-part-of-asg-error')
const AWSInvalidParameterTypeError = require('../errors/aws-invalid-parameter-type-error')
const AWSRateLimitError = require('../errors/aws-rate-limit-error')
const AWSValidationError = require('../errors/aws-validation-error')

/**
 * Model utilities for Shiva.
 * @module astral:shiva:models
 */
module.exports = class Util {
  /**
   * Execption handler that casts general AWS errors to specific classes so they
   * can be better handled by promise catch blocks in workers.
   * @param {Error} err The error to cast and re-throw.
   * @throws The error casted to a specific type (if applicable) or a general
   *   `AWSError`. If the error cannot be casted to an AWSError we directly
   *   rethrow the error.
   */
  static castAWSError (err) {
    if (err.code === 'AlreadyExists') {
      throw new AWSAlreadyExistsError(err)
    } else if (err.code === 'ValidationError') {
      Util._throwSpecificValidationError(err)
      throw new AWSValidationError(err)
    } else if (err.code === 'InvalidParameterType') {
      throw new AWSInvalidParameterTypeError(err)
    }
    throw err
  }

  static _throwSpecificValidationError (err) {
    if (~err.message.indexOf('limit exceeded')) {
      throw new AWSRateLimitError(err)
    } else if (~err.message.indexOf('is already part of AutoScalingGroup')) {
      throw new AWSAlreadyPartOfASGError(err)
    }
  }
}
