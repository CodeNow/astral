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
     * Promisified variant of `IAM.listUsers`
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
     * @throws AWSDeleteConflictError
     */
    static deleteUserAsync (options) {
      return IAM.deleteUser(options)
        .promise()
        .catch(Util.castAWSError)
    }

    /**
     * Promisified variant of `IAM.listUserPolicies`
     * @param {Object} options          - Options to pass the AWS method.
     * @param {String} options.UserName - Username of the user to fetch
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static listUserPoliciesAsync (options) {
      return IAM.listUserPolicies(options)
        .promise()
        .catch(Util.castAWSError)
    }

    /**
     * Promisified variant of `IAM.listUserPolicies`
     * @param {Object} options          - Options to pass the AWS method.
     * @param {String} options.UserName - Username of the user to fetch
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static listUserAccessKeysAsync (options) {
      return IAM.listAccessKeys(options)
        .promise()
        .catch(Util.castAWSError)
    }

    /**
     * Promisified variant of `IAM.deleteUserPolicy`
     * @param {Object} options            - Options to pass the AWS method.
     * @param {String} options.UserName   - Username of the user to fetch
     * @param {String} options.PolicyName - The policy name to delete
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static deleteUserPolicyAsync (options) {
      return IAM.deleteUserPolicy(options)
        .promise()
        .catch(Util.castAWSError)
    }

    /**
     * Promisified variant of `IAM.deleteUserPolicy`
     * @param {Object} options             - Options to pass the AWS method.
     * @param {String} options.UserName    - Username of the user to fetch
     * @param {String} options.AccessKeyId - AccessKey to delete
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static deleteUserAccessKeyAsync (options) {
      return IAM.deleteAccessKey(options)
        .promise()
        .catch(Util.castAWSError)
    }

    /**
     * Given a username, fetch all of the user policies embedded on the user, and delete each one
     * @param {Object} options            - Options to pass the AWS method.
     * @param {String} options.UserName   - Username of the user to fetch
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static deleteAllUserPoliciesAsync (options) {
      return this.listUserPoliciesAsync(options)
        .get('PolicyNames')
        .map(policyName => this.deleteUserPolicyAsync(Object.assign(options, { PolicyName: policyName })))
        .catch(Util.castAWSError)
    }

    /**
     * Given a username, fetch all of the access keys embedded on the user, and delete each one
     * @param {Object} options            - Options to pass the AWS method.
     * @param {String} options.UserName   - Username of the user to fetch
     *
     * @return {Promise} A promise that resolves with the AWS response.
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static deleteAllUserAccessKeysAsync (options) {
      return this.listUserAccessKeysAsync(options)
        .get('AccessKeyMetadata')
        .map(accessKey => this.deleteUserAccessKeyAsync(Object.assign(options, { AccessKeyId: accessKey.AccessKeyId })))
        .catch(Util.castAWSError)
    }

    /**
     * Fetch all of the users with the given options.  This will fetch all of the pages of the users
     * and return them in the resolved array
     * @param {Object} options            - Options to pass the AWS method.
     * @param {String} options.MaxItems   - Maximum items to fetch per go
     * @param {String} options.Marker     - Pagination marker to pick up the next page
     *
     * @resolves {Users[]} All the users
     *
     * @throws AWSAlreadyExistsError
     * @throws AWSValidationError
     * @throws AWSInvalidParameterTypeError
     * @throws AWSRateLimitError
     */
    static listAllUsersAsync (options, userArray) {
      if (!userArray) {
        userArray = []
      }
      return this.listUsersAsync(options)
        .then(results => {
          userArray = userArray.concat(results.Users)
          if (results.IsTruncated) {
            return this.listAllUsersAsync(Object.assign(options, { Marker: results.Marker }), userArray)
          }
          return userArray
        })
        .catch(Util.castAWSError)
    }
}
