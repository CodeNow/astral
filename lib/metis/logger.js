'use strict';

require('loadenv')({ project: 'metis',  debugName: 'astral:metis:env' });

var logger = require('../common/logger');

/**
 * Bunyan logger for metis.
 * @author Ryan Sandor Richards
 * @module astral:metis:logger
 */
module.exports = logger.create('metis', { job: jobSerializer });

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
    // We don't want to log the entire data set because it is verbose. Gradually
    // add specific, and important, github event data we do want to expose.
    if (key === 'payload') {
      return;
    }
    obj[key] = job[key];
  });
  return obj;
}
