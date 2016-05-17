'use strict'

var log = require('./logger')
var ponos = require('ponos')

/**
 * Names of the job queues that are consumed by shiva.
 * @type {array}
 */
var queues = [
  'asg.create',
  'asg.delete',
  'asg.update',
  'asg.instance.terminate'
]

var server = new ponos.Server({ log: log })

// Set the task handlers for each queue
queues.forEach(function (name) {
  var taskHandler = require('./tasks/' + name)
  server.setTask(name, taskHandler)
})

/**
 * Singelton instance of the worker server.
 * @module shiva:server
 */
module.exports = server
