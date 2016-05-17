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

var server = new ponos.Server({ log: log })

// Set the task handlers for each queue
queues.forEach(function (name) {
  server.setTask(name, require('./tasks/' + name))
})

/**
 * Singelton instance of the worker server.
 * @module metis:server
 */
module.exports = server
