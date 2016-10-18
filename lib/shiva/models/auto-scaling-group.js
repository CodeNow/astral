'use strict'

var AutoScaling = require('./aws/auto-scaling')
var AutoScalingGroupConfig = require('../config/auto-scaling-group.js')
var clone = require('101/clone')
var defaults = require('101/defaults')
var InvalidArgumentError =
require('../../common/errors/invalid-argument-error')
var isEmpty = require('101/is-empty')
var isObject = require('101/is-object')
var isString = require('101/is-string')
var Promise = require('bluebird')
var Util = require('./util')

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
    static _getName (org) {
      return [
        'asg',
        process.env.NODE_ENV,
        org
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
     * @param {string} org The id of the organization for the group.
     * @param {object} [options] Additional aws options (overrides default).
     * @return {Promise} A promise that resolves on aws request completion.
     */
    static create (org, options) {
      options = options || {}
      return Promise
        .try(function validateArguments () {
          if (!isString(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
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
          var name = AutoScalingGroup._getName(org)
          var requestOptions = clone(options)
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
                Value: org,
                PropagateAtLaunch: true
              }
            ]
          })
          return requestOptions
        })
        .then(AutoScalingGroup._setLaunchConfigurationName)
        .then(AutoScaling.createAutoScalingGroupAsync)
        .catch(Util.castAWSError)
    }

    /**
     * Gets the configuration for a specific Auto-Scaling Group.
     * @param {String} org Id of the organization.
     * @param {object} [options] Additional aws options.
     * @return {Promise} A promise that resolves with the auto scaling group
     *   objects returned by AWS.
     */
    static get (org, options) {
      options = options || {}
      return Promise
        .try(function validateArguments () {
          if (!isString(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
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
            AutoScalingGroupNames: [ AutoScalingGroup._getName(org) ]
          })
          return requestOptions
        })
        .then(AutoScaling.describeAutoScalingGroupsAsync)
        .catch(Util.castAWSError)
    }

    /**
     * Removes an Auto-Scaling Group.
     * @param {String} org Id of the organization.
     * @param {object} [options] Additional aws options.
     * @return {Promise} A promise that resolves on aws request completion.
     */
    static remove (org, options) {
      options = options || {}
      return Promise
        .try(function validateArguments () {
          if (!isString(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
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
          return AutoScalingGroup.update(org, {
            DesiredCapacity: 0,
            MaxSize: 0,
            MinSize: 0
          })
        })
        .then(function getRequestOptions () {
          var requestOptions = clone(options)
          defaults(requestOptions, AutoScalingGroupConfig.remove)
          defaults(requestOptions, {
            AutoScalingGroupName: AutoScalingGroup._getName(org)
          })
          return requestOptions
        })
        .then(AutoScaling.deleteAutoScalingGroupAsync)
        .catch(Util.castAWSError)
    }

    /**
     * Updates the configuration for a specified Auto-Scaling Group.
     * @param {string} org Id of the organization.
     * @param {object} options Options to change for the group's configuration.
     * @return {Promise} A promise that resolves on aws request completion.
     */
    static update (org, options) {
      return Promise
        .try(function validateArguments () {
          if (!isString(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
              'Argument `org` must be a string'
            )
          }
          if (isEmpty(org)) {
            throw new InvalidArgumentError(
              'org',
              org,
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
          requestOptions.AutoScalingGroupName = AutoScalingGroup._getName(org)
          return requestOptions
        })
        .then(AutoScaling.updateAutoScalingGroupAsync)
        .catch(Util.castAWSError)
    }

    static attachInstances (orgId, instances) {
      return Promise
        .try(() => {
          if (!isString(orgId)) {
            throw new InvalidArgumentError(
              'orgId',
              orgId,
              'Argument `orgId` must be a string'
            )
          }
          if (isEmpty(orgId)) {
            throw new InvalidArgumentError(
              'orgId',
              orgId,
              'Argument `orgId` must not be empty'
            )
          }
          if (!Array.isArray(instances)) {
            throw new InvalidArgumentError(
              'instances',
              instances,
              'Argument `instances` must be an array'
            )
          }
          if (isEmpty(instances)) {
            throw new InvalidArgumentError(
              'instances',
              instances,
              'Argument `instances` must not be empty'
            )
          }
          return {
            AutoScalingGroupName: orgId,
            InstanceIds: instances
          }
        })
        .tap(AutoScaling.attachInstancesAsync)
        .catch(Util.castAWSError)
    }
}
