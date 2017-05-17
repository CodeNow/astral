'use strict'

const AutoScaling = require('./aws/auto-scaling')
const AutoScalingGroupConfig = require('../config/auto-scaling-group.js')
const clone = require('101/clone')
const defaults = require('101/defaults')
const InvalidArgumentError =
require('../../common/errors/invalid-argument-error')
const isEmpty = require('101/is-empty')
const isObject = require('101/is-object')
const isString = require('101/is-string')
const Promise = require('bluebird')
const Util = require('./util')
const joi = require('joi')

/**
 * Model for handling AWS AutoScaling Groups.
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/AutoScaling.html
 * @see http://goo.gl/oNaL6V (AWS AutoScale Groups Guide)
 */
module.exports =
  class AutoScalingGroup {
    /**
     * Determines the auto-scaling group name for a given organization based on
     * the current environment.
     * @param {string} org Id for the organization.
     * @return {string} The auto-scaling group name.
     */
    static _getName (orgId) {
      return [
        'asg',
        process.env.NODE_ENV,
        orgId
      ].join('-')
    }

    /**
     * Sets the preferred launch configuration from the configuration.
     * @param {object} options Options upon which to set the AWS launch
     *   configuration name.
     * @return {object} The modified options.
     */
    static _setLaunchConfigurationName (options) {
      // TODO Eventually we will need to pull this dynamically from consul...
      options.LaunchConfigurationName = process.env.AWS_LAUNCH_CONFIGURATION_NAME
      return Promise.resolve(options)
    }

    /**
     * Creates a new AWS Auto-Scaling Group.
     * @param {string} orgId The id of the organization for the group.
     * @param {object} [options] Additional aws options (overrides default).
     * @return {Promise} A promise that resolves on aws request completion.
     */
    static create (orgId, bigPoppaId, options) {
      options = options || {}
      return Promise
        .try(function validateArguments () {
          if (!isString(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must not be empty'
            )
          }
          if (!isString(bigPoppaId)) {
            throw new InvalidArgumentError(
              'bigPoppa',
              bigPoppaId,
              'Argument `bigPoppa` must be a string'
            )
          }
          if (isEmpty(bigPoppaId)) {
            throw new InvalidArgumentError(
              'bigPoppa',
              bigPoppaId,
              'Argument `bigPoppa` must not be empty'
            )
          }
          if (!isObject(options)) {
            throw new InvalidArgumentError(
              'options',
              options,
              'Argument `options` must be an object'
            )
          }
        })
        .then(function getRequestOptions () {
          const name = AutoScalingGroup._getName(orgId)
          let requestOptions = clone(options)
          defaults(requestOptions, AutoScalingGroupConfig.create)
          defaults(requestOptions, {
            AutoScalingGroupName: name,
            Tags: [
              {
                ResourceId: name,
                ResourceType: 'auto-scaling-group',
                Key: 'role',
                Value: 'dock',
                PropagateAtLaunch: true
              },
              {
                ResourceId: name,
                ResourceType: 'auto-scaling-group',
                Key: 'env',
                Value: process.env.NODE_ENV,
                PropagateAtLaunch: true
              },
              {
                ResourceId: name,
                ResourceType: 'auto-scaling-group',
                Key: 'org',
                Value: orgId,
                PropagateAtLaunch: true
              },
              {
                ResourceId: name,
                ResourceType: 'auto-scaling-group',
                Key: 'big-poppa',
                Value: bigPoppaId,
                PropagateAtLaunch: true
              }
            ]
          })
          return requestOptions
        })
        .then(AutoScalingGroup._setLaunchConfigurationName)
        .then(AutoScaling.createAutoScalingGroupAsync)
        .catch(Util.getAWSErrorCaster({
          org: orgId,
          options: options
        }))
    }

    /**
     * Gets the configuration for a specific Auto-Scaling Group.
     * @param {String} orgId Id of the organization.
     * @param {object} [options] Additional aws options.
     * @return {Promise} A promise that resolves with the auto scaling group
     *   objects returned by AWS.
     */
    static get (orgId, options) {
      options = options || {}
      return Promise
        .try(function validateArguments () {
          if (!isString(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must not be empty'
            )
          }
          if (!isObject(options)) {
            throw new InvalidArgumentError(
              'options',
              options,
              'Argument `options` must be an object'
            )
          }
        })
        .then(function getRequestOptions () {
          var requestOptions = clone(options)
          defaults(requestOptions, {
            AutoScalingGroupNames: [ AutoScalingGroup._getName(orgId) ]
          })
          return requestOptions
        })
        .then(AutoScaling.describeAutoScalingGroupsAsync)
        .catch(Util.getAWSErrorCaster({
          org: orgId,
          options: options
        }))
    }

    /**
     * Removes an Auto-Scaling Group.
     * @param {String} orgId Id of the organization.
     * @param {object} [options] Additional aws options.
     * @return {Promise} A promise that resolves on aws request completion.
     */
    static remove (orgId, options) {
      options = options || {}
      return Promise
        .try(function validateArguments () {
          if (!isString(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must not be empty'
            )
          }
          if (!isObject(options)) {
            throw new InvalidArgumentError(
              'options',
              options,
              'Argument `options` must be an object'
            )
          }
        })
        .then(function scaleGroupDown () {
          return AutoScalingGroup.update(orgId, {
            DesiredCapacity: 0,
            MaxSize: 0,
            MinSize: 0
          })
        })
        .then(function getRequestOptions () {
          var requestOptions = clone(options)
          defaults(requestOptions, AutoScalingGroupConfig.remove)
          defaults(requestOptions, {
            AutoScalingGroupName: AutoScalingGroup._getName(orgId)
          })
          return requestOptions
        })
        .then(AutoScaling.deleteAutoScalingGroupAsync)
        .catch(Util.getAWSErrorCaster({
          org: orgId,
          options: options
        }))
    }

    /**
     * Updates the configuration for a specified Auto-Scaling Group.
     * @param {string} orgId Id of the organization.
     * @param {object} options Options to change for the group's configuration.
     * @return {Promise} A promise that resolves on aws request completion.
     */
    static update (orgId, options) {
      return Promise
        .try(function validateArguments () {
          if (!isString(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(orgId)) {
            throw new InvalidArgumentError(
              'org',
              orgId,
              'Argument `org` must not be empty'
            )
          }
          if (!isObject(options)) {
            throw new InvalidArgumentError(
              'options',
              options,
              'Argument `options` must be an object'
            )
          }
          if (isEmpty(Object.keys(options))) {
            throw new InvalidArgumentError(
              'options',
              options,
              'Argument `options` must not be empty'
            )
          }
        })
        .then(function getRequestOptions () {
          var requestOptions = clone(options)
          requestOptions.AutoScalingGroupName = AutoScalingGroup._getName(orgId)
          return requestOptions
        })
        .then(AutoScaling.updateAutoScalingGroupAsync)
        .catch(Util.getAWSErrorCaster({
          org: orgId,
          options: options
        }))
    }

    /**
     * Attach an instance to an ASG
     * @param orgId ID of the organization
     * @param instance ID of the instance to attach
     * @return {Promise} A promise that resolves on aws request completion.Promise.<T>|*}
     */
    static attachInstance (orgId, instance) {
      return Promise
        .try(() => {
          let attachSchema = joi.object({
            AutoScalingGroupName: joi.string().required(),
            InstanceIds: joi.array().items(joi.string()).required()
          })
          let attachParams = {
            AutoScalingGroupName: orgId,
            InstanceIds: instance
          }
          joi.assert(attachParams, attachSchema)
          return attachParams
        })
        .tap(AutoScaling.attachInstancesAsync)
        .catch(Util.getAWSErrorCaster({
          orgId: orgId,
          instance: instance
        }))
    }
}
