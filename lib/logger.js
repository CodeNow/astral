'use strict';

require('loadenv')('shiva:env');
var bunyan = require('bunyan');

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
  serializers: bunyan.stdSerializers
});
