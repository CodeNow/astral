'use strict';

var aws = require('./aws');
var clone = require('101/clone');
var exists = require('101/exists');
var fs = require('fs');
var InvalidArgumentError =
  require('../../common/errors/invalid-argument-error');
var isEmpty = require('101/is-empty');
var isObject = require('101/is-object');
var isString = require('101/is-string');
var LaunchConfigurationConfig = require('../config/launch-configuration.js');
var Promise = require('bluebird');
var Util = require('./util');
var readFileAsync = Promise.promisify(fs.readFile);

/**
 * Base64 enccoded Launch Configuration User Data Script used to upstart docks.
 * This is set by the LaunchConfiguration._getUserDataScript method below.
 * @type {string}
 */
var userDataScript = null;

/**
 * Model for handling AWS AutoScale Launch Configurations.
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
  static create (name, options={}) {
    return Promise
      .try(function validateArguments() {
        if (!isString(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'LaunchConfiguration.create: Argument `name` must be a string'
          );
        }
        if (isEmpty(name)) {
          throw new InvalidArgumentError(
            'name',
            name,
            'LaunchConfiguration.create: Argument `name` must not be empty'
          );
        }
        if (!isObject(options)) {
          throw new InvalidArgumentError(
            'options',
            options,
            'LaunchConfiguration.create: Argument `options` must be an object'
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
      .then(aws.AutoScale.createLaunchConfigurationAsync)
      .catch(Util.castAWSError);
  }

  /**
   * Removes a launch configuration.
   * @param {string} name Name of the launch configuration to remove.
   * @param {object} [options] Additional aws options (overrides default).
   * @return {Promise} A promise that resolves
   */
  static remove (name, options={}) {
    return Promise.reject(new Error('Not Implemented'));
  }

  /**
   * Gets informaiton for a specific launch configurations.
   * @param {Array} names Names of the launch configurations to retrieve.
   * @param {object} options Additional aws options.
   * @return {Promise} A promise that resolves with the launch configuration
   *   objects returned by AWS.
   */
  static get (names, options={}) {
    return Promise.reject(new Error('Not Implemented'));
  }
};
