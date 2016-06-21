'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

var logger = require('../common/logger')
var isObject = require('101/is-object')

/**
 * Bunyan logger for shiva.
 * @author Ryan Sandor Richards
 * @module shiva:logger
 */
module.exports = logger.create('shiva', { job: jobSerializer })

/**
 * Bunyan serializer for jobs. Certain jobs contain a lot of information that
 * is far too verbose for the logs. This limits the amount of information that
 * is reported.
 * @param {object} job Job to serialize.
 * @return {object} The serialized job.
 */
function jobSerializer (job) {
  var obj = {}
  Object.keys(job).forEach(function (key) {
    var value = job[key]

    if (key === 'instance' && isObject(value)) {
      obj[key] = {
        ImageId: value.ImageId,
        InstanceId: value.InstanceId,
        InstanceType: value.InstanceType,
        KeyName: value.KeyName,
        PrivateIpAddress: value.PrivateIpAddress,
        SubnetId: value.SubnetId,
        VpcId: value.VpcId
      }
      return
    }

    obj[key] = value
  })
  return obj
}
