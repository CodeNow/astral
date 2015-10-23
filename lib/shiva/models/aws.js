'use strict';

var Promise = require('bluebird');
var aws = require('aws-sdk');
var AutoScaleAsync = Promise.promisifyAll(AWS.AutoScale.prototype);

/**
 * Promisified AWS SDK Modules for Shiva.
 * @module astral:shiva:models
 */
module.exports = {
  /**
   * AWS Auto Scale API Interface.
   * @type {AWS.AutoScale}
   */
  AutoScale: new AutoScaleAsync({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  })
};
