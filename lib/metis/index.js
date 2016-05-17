'use strict'

require('loadenv')({ project: 'metis', debugName: 'astral:metis:env' })

var server = require('./server')
var log = require('./logger').child({ module: 'index' })

/**
 * Entrypoint for the metis data collector / aggregator.
 * @author Ryan Sandor Richards
 * @module metis
 */

server.start().then(function () {
  log.info({ env: process.env }, 'Metis Started')
})
