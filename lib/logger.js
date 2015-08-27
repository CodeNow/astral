'use strict';

require('loadenv')('shiva:env');

var defaults = require('101/defaults');
var exists = require('101/exists');
var bunyan = require('bunyan');

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
var log = module.exports = bunyan.createLogger({
  name: 'shiva',
  streams: [
    {
      level: process.env.LOG_LEVEL,
      stream: process.stdout
    }
  ],
  serializers: serializers
});


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
    if (key === 'instances' && Array.isArray(value)) {
      obj[key] = value.map(function (instance) {
        return {
          ImageId: instance.ImageId,
          InstanceId: instance.InstanceId,
          InstanceType: instance.InstanceType,
          KeyName: instance.KeyName,
          PrivateIpAddress: instance.PrivateIpAddress,
          SubnetId: instance.SubnetId,
          VpcId: instance.VpcId
        };
      });
    }
    else {
      obj[key] = value;
    }
  });
  return obj;
}
