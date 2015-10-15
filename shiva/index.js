'use strict';

var server = require('./server');
var error = require('./error');
var log = require('./logger');

/**
 * Entrypoint for the shiva provisioning manager.
 * @author Ryan Sandor Richards
 * @module shiva
 */

server.start();
