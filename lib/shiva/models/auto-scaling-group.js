'use strict';

var AutoScaling = require('./aws/auto-scaling');
var AutoScalingGroupConfig = require('../config/auto-scaling-group.js');
var clone = require('101/clone');
var defaults = require('101/defaults');
var InvalidArgumentError =
  require('../../common/errors/invalid-argument-error');
var isEmpty = require('101/is-empty');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var Promise = require('bluebird');
var Util = require('./util');

/**
 * Model for handling AWS AutoScaling Groups.
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/AutoScaling.html
 * @see http://goo.gl/oNaL6V (AWS AutoScale Groups Guide)
 */
module.exports = class AutoScalingGroup {
  /**
   * Sets the preferred launch configuration from the configuration.
   * @param {object} options Options upon which to set the AWS launch
   *   configuration name.
   * @return {object} The modified options.
   */
  static _setLaunchConfigurationName (options) {
    // TODO We need to pull this dynamically from consul...
    options.LaunchConfigurationName = process.env.AWS_LAUNCH_CONFIGURATION_NAME;
    return Promise.resolve(options);
  }

  /**
   * Creates a new AWS Auto-Scaling Group.
   * @param {string} name Name for the group.
   * @param {object} [options] Additional aws options (overrides default).
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static create(name, options) {
    options = options || {};
    return Promise
      .try(function validateArguments () {
        if (!isString(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'Argument `name` must be a string'
          );
        }
        if (isEmpty(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'Argument `name` must not be empty'
          );
        }
        if (!isObject(options)) {
          throw new InvalidArgumentError(
            'options',
            options,
            'Argument `options` must be an object'
          );
        }
      })
      .then(function getRequestOptions () {
        var requestOptions = clone(options);
        defaults(requestOptions, AutoScalingGroupConfig.create);
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
              Key: 'org',
              Value: name,
              PropagateAtLaunch: true
            }
          ]
        });
        return requestOptions;
      })
      .then(AutoScalingGroup._setLaunchConfigurationName)
      .then(AutoScaling.createAutoScalingGroupAsync)
      .catch(Util.castAWSError);
  }

  /**
   * Gets the configuration for a specific Auto-Scaling Group.
   * @param {Array|String} names Names of the auto scaling groups to retrieve.
   * @param {object} [options] Additional aws options.
   * @return {Promise} A promise that resolves with the auto scaling group
   *   objects returned by AWS.
   */
  static get(names, options) {
    options = options || {};
    return Promise
      .try(function validateArguments () {
        if (!isString(names) && !Array.isArray(names)) {
          throw new InvalidArgumentError(
            'names',
            names,
            'Argument `names` must be a string or an array'
          );
        }
        if (isEmpty(names)) {
          throw new InvalidArgumentError(
            'names',
            names,
            'Argument `names` must not be empty'
          );
        }
        if (!isObject(options)) {
          throw new InvalidArgumentError(
            'options',
            options,
            'Argument `options` must be an object'
          );
        }
      })
      .then(function getRequestOptions () {
        var arrayNames = Array.isArray(names) ? names : [ names ];
        var requestOptions = clone(options);
        defaults(requestOptions, { AutoScalingGroupNames: arrayNames });
        return requestOptions;
      })
      .then(AutoScaling.describeAutoScalingGroupsAsync)
      .catch(Util.castAWSError);
  }

  /**
   * Removes an Auto-Scaling Group.
   * @param {string} name Name of the group to remove.
   * @param {object} [options] Additional aws options.
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static remove(name, options) {
    options = options || {};
    return Promise
      .try(function validateArguments () {
        if (!isString(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'Argument `name` must be a string'
          );
        }
        if (isEmpty(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'Argument `name` must not be empty'
          );
        }
        if (!isObject(options)) {
          throw new InvalidArgumentError(
            'options',
            options,
            'Argument `options` must be an object'
          );
        }
      })
      .then(function getRequestOptions () {
        var requestOptions = clone(options);
        defaults(requestOptions, AutoScalingGroupConfig.remove);
        defaults(requestOptions, { AutoScalingGroupName: name });
        return requestOptions;
      })
      .then(AutoScaling.deleteAutoScalingGroupAsync)
      .catch(Util.castAWSError);
  }

  /**
   * Updates the configuration for a specified Auto-Scaling Group.
   * @param {string} name Name of the group to remove.
   * @param {object} options Options to change for the group's configuration.
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static update(name, options) {
    return Promise
      .try(function validateArguments () {
        if (!isString(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'Argument `name` must be a string'
          );
        }
        if (isEmpty(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'Argument `name` must not be empty'
          );
        }
        if (!isObject(options)) {
          throw new InvalidArgumentError(
            'options',
            options,
            'Argument `options` must be an object'
          );
        }
        if (isEmpty(Object.keys(options))) {
          throw new InvalidArgumentError(
            'options',
            options,
            'Argument `options` must not be empty'
          );
        }
      })
      .then(function getRequestOptions () {
        var requestOptions = clone(options);
        defaults(requestOptions, { AutoScalingGroupName: name });
        return requestOptions;
      })
      .then(AutoScaling.updateAutoScalingGroupAsync)
      .catch(Util.castAWSError);
  }
};
