'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
var awsSDK = require('aws-sdk')
var Promise = require('bluebird')
const Util = require('../util')

/**
 * AWS IAM API Interface.
 * @type {AWS.EC2}
 */
var IAM = new awsSDK.IAM()
awsSDK.config.setPromisesDependency(Promise)
/**
 * Promisified interface to the AWS IAM SDK.
 */
module.exports =
  class IAMAsync {
    /**
     * @return The SDK instance used by this class.
     */
    static getSDK () {
      return IAM
    }

    /**
     * Promisified variant of `IAM.describeInstances`
     * @param {object} options Options to pass the AWS method.
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static listUsersAsync (options) {
      return IAM.listUsers(options)
        .promise()
        .catch(Util.castAWSError)
    }

    /**
     * Promisified variant of `IAM.deleteUser`
     * @param {object} options Options to pass the AWS method.
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static deleteUserAsync (options) {
      return IAM.deleteUser(options)
        .promise()
        .catch(Util.castAWSError)
    }
}
