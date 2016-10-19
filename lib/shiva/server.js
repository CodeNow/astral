'use strict'

var log = require('./logger')
var ponos = require('ponos')

/**
 * Names of the job queues that are consumed by shiva.
 * @type {array}
 */

var tasks = {
  'asg.create': require('./tasks/asg.create'),
  'asg.delete': require('./tasks/asg.delete'),
  'asg.instance.terminate': require('./tasks/asg.instance.terminate'),
  'asg.policy.scale-out.create': require('./tasks/asg.policy.scale-out.create'),
  'asg.update': require('./tasks/asg.update'),
  'dock.attach': require('./tasks/dock.attach.js')
}

var events = {
  'organization.created': require('./events/organization.created'),
  'asg.update.requested': require('./tasks/asg.update'),
  'dock.purged': require('./tasks/asg.instance.terminate'),
  'organization.allowed': require('./tasks/asg.create'),
  'organization.disallowed': require('./tasks/asg.delete')
}

var server = new ponos.Server({
  log: log,
  tasks: tasks,
  events: events
})

/**
 * Singelton instance of the worker server.
 * @module shiva:server
 */
module.exports = server
