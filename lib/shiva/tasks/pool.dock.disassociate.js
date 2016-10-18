'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')

const DockPool = require('../models/dock-pool')
const RabbitMQ = require('../../common/models/astral-rabbitmq')

/**
 * Task handler for the `asg.update` queue.
 * @author Ryan Sandor Richards
 * @module astral:shiva:tasks
 */
const PoolDockDisassociate = {}

module.exports = PoolDockDisassociate

/**
 * 1. get random server from pool ASG
 * 2. dissassociate it
 */

PoolDockDisassociate.jobSchema = joi.object({
  githubOrgId: joi.number().required()
}).unknown().required()

PoolDockDisassociate.task = (job) => {
  return DockPool.getRandomDockIp()
    .tap((dockerHostIp) => {
      return DockPool.dissassociateDockerHost(dockerHostIp)
    })
    .tap((dockerHostIp) => {
      return Promise.using(RabbitMQ.getClient(), (publisher) => {
        return publisher.publishTask('dock.associate', {
          dockerHostIp: dockerHostIp,
          githubOrgId: job.githubOrgId
        })
      })
    })
}
