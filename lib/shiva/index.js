'use strict'
require('loadenv')({ debugName: 'shiva:env', project: 'shiva' })

const log = require('./logger').child({ module: 'index' })
const publisher = require('../common/models/astral-rabbitmq')
const server = require('./server')

/**
 * Entrypoint for the shiva provisioning manager.
 * @author Ryan Sandor Richards
 * @module shiva
 */

publisher.connect()
  .then(() => {
    return server.start()
      .then(() => {
        log.info({ env: process.env }, 'Shiva Started')
      })
  })
