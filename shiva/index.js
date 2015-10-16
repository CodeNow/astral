'use strict';

require('loadenv')({ debugName: 'shiva:env', project: 'shiva' });

var server = require('./server');
var log = require('./logger').child({ module: 'index' });

/**
 * Entrypoint for the shiva provisioning manager.
 * @author Ryan Sandor Richards
 * @module shiva
 */

server.start()
  .then(function () {
    log.info({ env: process.env }, 'Shiva Started');
  });
