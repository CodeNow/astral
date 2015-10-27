'use strict';

var Promise = require('bluebird');
var awsSDK = require('aws-sdk');

/**
 * AWS Auto Scale API Interface.
 * @type {AWS.AutoScaling}
 */
var AutoScaling = new awsSDK.AutoScaling({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * Promisified interface to AWS AutoScaling.
 */
class AutoScalingAsync {
  /**
   * Promisified variant of createLaunchConfiguration
   * @param {object} options Options to pass the AWS method.
   */
  static createLaunchConfigurationAsync (options) {
    return new Promise(function (resolve, reject) {
      AutoScaling.createLaunchConfiguration(options, function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }

  /**
   * Promisified variant of describeLaunchConfigurations
   * @param {object} options Options to pass the AWS method.
   */
  static describeLaunchConfigurationsAsync (options) {
    return new Promise(function (resolve, reject) {
      AutoScaling.describeLaunchConfigurations(options, function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }

  /**
   * Promisified variant of deleteLaunchConfiguration
   * @param {object} options Options to pass the AWS method.
   */
  static deleteLaunchConfigurationAsync (options) {
    return new Promise(function (resolve, reject) {
      AutoScaling.deleteLaunchConfiguration(options, function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }
}

/**
 * Promisified AWS SDK Modules for Shiva.
 * @module astral:shiva:models
 */
module.exports = {
  AutoScaling: AutoScalingAsync
};
