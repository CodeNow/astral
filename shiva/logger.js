'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

var bunyan = require('bunyan');
var defaults = require('101/defaults');
var exists = require('101/exists');
var isObject = require('101/is-object');

/**
 * Serializers for shiva's bunyan logger.
 * @type {object}
 */
var serializers = {
  err: errorSerializer,
  job: jobSerializer,
  env: envSerializer
};
defaults(serializers, bunyan.stdSerializers);

/**
 * Bunyan logger for shiva.
 * @author Ryan Sandor Richards
 * @module shiva:logger
 */
var logger = module.exports = bunyan.createLogger({
  name: 'shiva',
  streams: getStreams(),
  serializers: serializers
});

// Expose get streams for unit testing
logger.getStreams = getStreams;

/**
 * Streams for shiva's bunyan logger.
 * @return {array} An array of streams for the bunyan logger
 */
function getStreams() {
  return [
    {
      level: process.env.LOG_LEVEL,
      stream: process.stdout
    }
  ];
}

/**
 * Bunyan error serializer. Handles additional data field added by ErrorCat.
 * @param {Error} err Error to serialize.
 * @return {object} The serialized error object.
 */
function errorSerializer(err) {
  var obj = bunyan.stdSerializers.err(err);
  if (exists(err.data)) {
    obj.data = err.data;
  }
  return obj;
}

/**
 * Bunyan serializer for jobs. Certain jobs contain a lot of information that
 * is far too verbose for the logs. This limits the amount of information that
 * is reported.
 * @param {object} job Job to serialize.
 * @return {object} The serialized job.
 */
function jobSerializer(job) {
  var obj = {};
  Object.keys(job).forEach(function (key) {
    var value = job[key];
    if (key === 'instance' && isObject(value)) {
      obj[key] = {
        ImageId: value.ImageId,
        InstanceId: value.InstanceId,
        InstanceType: value.InstanceType,
        KeyName: value.KeyName,
        PrivateIpAddress: value.PrivateIpAddress,
        SubnetId: value.SubnetId,
        VpcId: value.VpcId
      };
    }
    else {
      obj[key] = value;
    }
  });
  return obj;
}

/**
 * The node process environment often contains a lot of useless information
 * this reduces the verbosity of a reported environment.
 * @param {object} env The environment to report.
 * @return {object} A stripped down version with only relevant environment
 *   variables.
 */
function envSerializer(env) {
  var obj = {};

  // Keep the git head variable (it is actually useful)
  if (exists(env.npm_package_gitHead)) {
    obj['npm_package_gitHead'] = env['npm_package_gitHead'];
  }

  // Filter out the kinda useless and verbose `npm_*` variables
  Object.keys(env).forEach(function (key) {
    if (key.match(/^npm_/)) { return; }
    obj[key] = env[key];
  });
  return obj;
}
