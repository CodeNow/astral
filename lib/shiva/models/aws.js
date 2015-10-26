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
Promise.promisifyAll(AutoScaling);

/**
 * Promisified AWS SDK Modules for Shiva.
 * @module astral:shiva:models
 */
module.exports = {
  AutoScaling: AutoScaling
};
