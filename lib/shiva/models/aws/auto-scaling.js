'use strict'

var awsSDK = require('aws-sdk')
var AWSMethodMissingError = require('../../errors/aws-method-missing-error')
var isFunction = require('101/is-function')
var Promise = require('bluebird')

/**
 * AWS Auto-Scaling API Interface.
 * @type {AWS.AutoScaling}
 */
var AutoScaling = new awsSDK.AutoScaling({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

/**
 * Promisified interface to AWS AutoScaling.
 */
module.exports =
  class AutoScalingAsync {
    /**
     * Promisifies a request to the given AutoScaling method and then makes a
     * request with the given options.
     * @param {string} method Method to call on the AutoScaling aws-sdk object.
     * @param {object} options Options to send with the request.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static _request (method, options) {
      return new Promise(function (resolve, reject) {
        if (!isFunction(AutoScaling[method])) {
          reject(new AWSMethodMissingError('AutoScaling', method))
        }
        AutoScaling[method](options, function (err, data) {
          if (err) { return reject(err) }
          resolve(data)
        })
      })
    }

    /**
     * @return The SDK instance used by this class.
     */
    static getSDK () {
      return AutoScaling
    }

    /**
     * Promisified variant of createAutoScalingGroup
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static createAutoScalingGroupAsync (options) {
      return AutoScalingAsync._request('createAutoScalingGroup', options)
    }

    /**
     * Promisified variant of deleteAutoScalingGroup
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static deleteAutoScalingGroupAsync (options) {
      return AutoScalingAsync._request('deleteAutoScalingGroup', options)
    }

    /**
     * Promisified variant of describeAutoScalingGroups
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static describeAutoScalingGroupsAsync (options) {
      return AutoScalingAsync._request('describeAutoScalingGroups', options)
    }

    /**
     * Promisified variant of updateAutoScalingGroup
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static updateAutoScalingGroupAsync (options) {
      return AutoScalingAsync._request('updateAutoScalingGroup', options)
    }

    /**
     * Promisified variant of createLaunchConfiguration
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static createLaunchConfigurationAsync (options) {
      return AutoScalingAsync._request('createLaunchConfiguration', options)
    }

    /**
     * Promisified variant of deleteLaunchConfiguration
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static deleteLaunchConfigurationAsync (options) {
      return AutoScalingAsync._request('deleteLaunchConfiguration', options)
    }

    /**
     * Promisified variant of describeLaunchConfigurations
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static describeLaunchConfigurationsAsync (options) {
      return AutoScalingAsync._request('describeLaunchConfigurations', options)
    }

    /**
     * Promisified variant of describeAutoScalingNotificationTypes
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static describeAutoScalingNotificationTypesAsync (options) {
      return AutoScalingAsync._request(
        'describeAutoScalingNotificationTypes',
        options
      )
    }

    /**
     * Promisified variant of describeNotificationConfigurations
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static describeNotificationConfigurationsAsync (options) {
      return AutoScalingAsync._request(
        'describeNotificationConfigurations',
        options
      )
    }

    /**
     * Promisified variant of describePolicies
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static describePoliciesAsync (options) {
      return AutoScalingAsync._request('describePolicies', options)
    }

    /**
     * Promisified variant of putNotificationConfiguration
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static putNotificationConfigurationAsync (options) {
      return AutoScalingAsync._request('putNotificationConfiguration', options)
    }

    /**
     * Promisified variant of putScalingPolicy
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static putScalingPolicyAsync (options) {
      return AutoScalingAsync._request('putScalingPolicy', options)
    }

    /**
     * Promisified variant of detachInstances
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static detachInstancesAsync (options) {
      return AutoScalingAsync._request('detachInstances', options)
    }

    /**
     * Promisified variant of attachInstances
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static attachInstancesAsync (options) {
      return AutoScalingAsync._request('attachInstances', options)
    }

    /**
     * Promisified variant of createOrUpdateTags
     * @param {object} options Options to pass the AWS method.
     * @return {Promise} A promise that resolves with the AWS response.
     */
    static createOrUpdateTagsAsync (options) {
      return AutoScalingAsync._request('createOrUpdateTags', options)
    }
}
