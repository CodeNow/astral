'use strict';

require('loadenv')('shiva:env');

var exists = require('101/exists');
var defaults = require('101/defaults');
var bunyan = require('bunyan');

var serializers = {
  err: function err(err) {
    var obj = bunyan.stdSerializers.err(err);
    if (exists(err.data)) {
      obj.data = err.data;
    }
    return obj;
  }
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
