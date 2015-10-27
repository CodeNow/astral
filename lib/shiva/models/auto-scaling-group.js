'use strict';

var AutoScaling = require('./aws/auto-scaling');
var Promise = require('bluebird');
var Util = require('./util');

/**
 * Model for handling AWS AutoScaling Groups.
 * @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/AutoScaling.html
 */
module.exports = class AutoScalingGroup {
  /**
   * Creates a new AWS Auto-Scaling Group.
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static create() {
    return Promise.reject(new Error('Not Implemented'));
  }

  /**
   * Gets the configuration for a specific Auto-Scaling Group.
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static get() {
    return Promise.reject(new Error('Not Implemented'));
  }

  /**
   * Removes an Auto-Scaling Group.
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static remove() {
    return Promise.reject(new Error('Not Implemented'));
  }

  /**
   * Updates the configuration for a specified Auto-Scaling Group.
   * @return {Promise} A promise that resolves on aws request completion.
   */
  static update() {
    return Promise.reject(new Error('Not Implemented'));
  }
};
