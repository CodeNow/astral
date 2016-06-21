'use strict';

var AWSMethodMissingError = require('../../errors/aws-method-missing-error');
var awsSDK = require('aws-sdk');
var isFunction = require('101/is-function');
var Promise = require('bluebird');

/**
 * AWS CloudWatch API Interface.
 * @type {AWS.CloudWatch}
 */
var CloudWatch = new awsSDK.CloudWatch({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * Promisified interface to AWS CloudWatch.
 */
module.exports = class CloudWatchAsync {
  /**
   * Promisifies a request to the given CloudWatch method and then makes a
   * request with the given options.
   * @param {string} method Method to call on the CloudWatch aws-sdk object.
   * @param {object} options Options to send with the request.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static _request(method, options) {
    return new Promise(function (resolve, reject) {
      if (!isFunction(CloudWatch[method])) {
        reject(new AWSMethodMissingError('CloudWatch', method));
      }
      CloudWatch[method](options, function (err, data) {
        if (err) { return reject(err); }
        resolve(data);
      });
    });
  }

  /**
   * @return The SDK instance used by this class.
   */
  static getSDK() {
    return CloudWatch;
  }

  /**
   * Promisified variant of describeAlarms
   * @param {object} options Options to pass the AWS method.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static describeAlarmsAsync (options) {
    return CloudWatchAsync._request('describeAlarms', options);
  }

  /**
   * Promisified variant of putMetricAlarm
   * @param {object} options Options to pass the AWS method.
   * @return {Promise} A promise that resolves with the AWS response.
   */
  static putMetricAlarmAsync (options) {
    return CloudWatchAsync._request('putMetricAlarm', options);
  }
};
