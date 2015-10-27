'use strict';

var AutoScaling = require('./aws/auto-scaling');
var clone = require('101/clone');
var exists = require('101/exists');
var defaults = require('101/defaults');
var fs = require('fs');
var InvalidArgumentError =
  require('../../common/errors/invalid-argument-error');
var isEmpty = require('101/is-empty');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var LaunchConfigurationConfig = require('../config/launch-configuration.js');
var path = require('path');
var Promise = require('bluebird');
var Util = require('./util');
var readFileAsync = Promise.promisify(fs.readFile);

/**
 * Base64 encoded Launch Configuration User Data Script used to upstart docks.
 * This is set by the LaunchConfiguration._getUserDataScript method below.
 * @type {string}
 */
var userDataScript = null;

/**
 * Model for handling AWS AutoScaling Launch Configurations.
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/AutoScaling.html
 * @see http://goo.gl/QCDqTU (AWS Launch Configurations Guide)
 * @module astra:shiva:models
 */
module.exports = class LaunchConfiguration {
  /**
   * Gets the user data script for launch configurations.
   * @return {Promise} A promise that resolves with the UserData script for the
   *   launch configuration.
   */
  static _getUserDataScript () {
    if (exists(userDataScript)) {
      return Promise.resolve(userDataScript);
    }

    var templatePath = path.resolve(
      __dirname,
      '../scripts/aws-launch-configuration-user-data.sh'
    );

    return readFileAsync(templatePath)
      .then(function (raw) {
        userDataScript = new Buffer(raw).toString('base64');
        return userDataScript;
      });
  }

  /**
   * Creates a new Launch Configuration.
   * @param {string} name Name for the new launch configuration.
   * @param {object} [options] Additional aws options (overrides default).
   * @return {Promise} A promise that resolves when the configuration has been
   *   has been created.
   */
  static create (name, options) {
    options = options || {};
    return Promise
      .try(function validateArguments() {
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
      .then(LaunchConfiguration._getUserDataScript)
      .then(function createRequestOptions(userData) {
        var requestOptions = clone(options);
        defaults(requestOptions, LaunchConfigurationConfig.create);
        defaults(requestOptions, {
          LaunchConfigurationName: name,
          UserData: userData
        });
        return requestOptions;
      })
      .then(AutoScaling.createLaunchConfigurationAsync)
      .catch(Util.castAWSError);
  }

  /**
   * Gets information for a specific launch configurations.
   * @param {Array|String} names Names of the launch configurations to retrieve.
   * @param {object} [options] Additional aws options.
   * @return {Promise} A promise that resolves with the launch configuration
   *   objects returned by AWS.
   */
  static get (names, options) {
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
      .then(function ensureNameIsArray () {
        return Array.isArray(names) ? names : [ names ];
      })
      .then(function createRequestOptions (names) {
        var requestOptions = clone(options);
        defaults(requestOptions, { LaunchConfigurationNames: names });
        return requestOptions;
      })
      .then(AutoScaling.describeLaunchConfigurationsAsync)
      .catch(Util.castAWSError);
  }

  /**
   * Removes a launch configuration.
   * @param {string} name Name of the launch configuration to remove.
   * @return {Promise} A promise that resolves
   */
  static remove (name) {
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
      })
      .then(function createRequestOptions () {
        return { LaunchConfigurationName: name };
      })
      .then(AutoScaling.deleteLaunchConfigurationAsync)
      .catch(Util.castAWSError);
  }
};
