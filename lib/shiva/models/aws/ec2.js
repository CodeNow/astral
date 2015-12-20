'use strict';

var awsSDK = require('aws-sdk');
var AWSMethodMissingError = require('../../errors/aws-method-missing-error');
var isFunction = require('101/is-function');
var Promise = require('bluebird');

/**
 * AWS EC2 API Interface.
 * @type {AWS.EC2}
 */
var EC2 = new awsSDK.EC2({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * Promisified interface to the AWS EC2 SDK.
 */
module.exports = class EC2Async {
  /**
   * Promisifies a request to the given EC2 method and then makes a
   * request with the given options.
   * @param {string} method Method to call on the EC2 aws-sdk object.
   * @param {object} options Options to send with the request.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static _request(method, options) {
    return new Promise(function (resolve, reject) {
      if (!isFunction(EC2[method])) {
        reject(new AWSMethodMissingError('EC2', method));
      }
      EC2[method](options, function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }

  /**
   * @return The SDK instance used by this class.
   */
  static getSDK() {
    return EC2;
  }

  /**
   * Promisified variant of `EC2.describeInstances`
   * @param {object} options Options to pass the AWS method.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static describeInstancesAsync (options) {
    return EC2Async._request('describeInstances', options);
  }

  /**
   * Promisified variant of `EC2.describeInstances`
   * @param {object} options Options to pass the AWS method.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static runInstancesAsync (options) {
    return EC2Async._request('runInstances', options);
  }

  /**
   * Promisified variant of `EC2.terminateInstances`
   * @param {object} options Options to pass the AWS method.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static terminateInstancesAsync (options) {
    return EC2Async._request('terminateInstances', options);
  }

  /**
   * Promisified variant of `EC2.waitFor`
   * @param {string} condition The condition for which to wait.
   * @param {object} options Options to pass the AWS method.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static waitForAsync (condition, options) {
    return new Promise(function (resolve, reject) {
      EC2.waitFor(condition, options, function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }
};
