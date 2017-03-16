'use strict'

var log = require('./logger')
var ponos = require('ponos')

/**
 * Names of the job queues that are consumed by shiva.
 * @type {array}
 */

var tasks = {
  'asg.create': require('./tasks/asg.create'),
  'asg.policy.scale-out.create': require('./tasks/asg.policy.scale-out.create'),
  'dock.attach': require('./tasks/dock.attach'),
  'dock.initialize': require('./tasks/dock.initialize'),
  'pool.dock.detach': require('./tasks/pool.dock.detach'),
  'iam.cleanup': require('./tasks/iam.cleanup')
}

var events = {
  'organization.created': require('./events/organization.created'),
  'asg.update.requested': require('./tasks/asg.update'),
  'dock.purged': require('./tasks/asg.instance.terminate'),
  'organization.allowed': require('./tasks/asg.create'),
  'organization.disallowed': require('./tasks/asg.delete')
}

var server = new ponos.Server({
  name: process.env.APP_NAME,
  log: log,
  tasks: tasks,
  events: events
})

/**
 * Singelton instance of the worker server.
 * @module shiva:server
 */
module.exports = server
