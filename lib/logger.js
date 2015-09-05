'use strict';

require('loadenv')('shiva:env');

var defaults = require('101/defaults');
var exists = require('101/exists');
var isObject = require('101/is-object');
var bunyan = require('bunyan');
var Bunyan2Loggly = require('bunyan-loggly').Bunyan2Loggly;

/**
 * Serializers for shiva's bunyan logger.
 * @type {object}
 */
var serializers = {
  err: errorSerializer,
  job: jobSerializer
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
  var streams = [
    {
      level: process.env.STDOUT_LOG_LEVEL,
      stream: process.stdout
    }
  ];

  if (exists(process.env.LOGGLY_TOKEN)) {
    streams.push({
      level: 'trace',
      stream: new Bunyan2Loggly({
        token: process.env.LOGGLY_TOKEN,
        subdomain: 'sandboxes'
      }, process.env.BUNYAN_BATCH_LOG_COUNT),
      type: 'raw'
    });
  }

  return streams;
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
