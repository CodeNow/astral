'use strict'
const RabbitMQ = require('ponos/lib/rabbitmq')

const log = require('../logger')
const schemas = require('./schemas')

class Publisher extends RabbitMQ {
  constructor () {
    super({
      name: process.env.APP_NAME,
      hostname: process.env.RABBITMQ_HOSTNAME,
      port: process.env.RABBITMQ_PORT,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
      log: log.create('publisher'),
      tasks: [{
        name: 'asg.policy.scale-out.create',
        jobSchema: schemas.asgPolicyScaleOutCreate
      }, {
        name: 'dock.attach',
        jobSchema: schemas.dockAttach
      }, {
        name: 'asg.create',
        jobSchema: schemas.asgCreate
      }, {
        name: 'pool.dock.detach',
        jobSchema: schemas.poolDockDetach
      }]
    })
  }
}

module.exports = new Publisher()
