'use strict';

var server = require('./lib/server');
var error = require('./lib/error');
var log = require('./lib/logger');

/**
 * Entrypoint for the shiva provisioning manager.
 * @author Ryan Sandor Richards
 * @module shiva
 */

server.start(function (err) {
  if (err) {
    var message = 'Failed to start shiva worker server';
    error.wrapAndReport(err, 500, message);
    log.fatal({ err: err }, message);
    return;
  }
});
