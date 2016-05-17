'use strict'

var log = require('./logger')
var ponos = require('ponos')

/**
 * Names of the job queues that are consumed by metis.
 * @type {array}
 */
var queues = [
  'metis-github-event'
]

/**
 * Singelton instance of the worker server.
 * @module metis:server
 */
var server = module.exports = new ponos.Server({ queues: queues, log: log })

// Set the task handlers for each queue
queues.forEach(function (name) {
  server.setTask(name, require('./tasks/' + name))
})
