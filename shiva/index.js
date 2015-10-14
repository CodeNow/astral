'use strict';

var server = require('./server').getInstance();;
var error = require('./error');
var log = require('./logger');

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
