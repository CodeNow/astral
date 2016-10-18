'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')

const DockPool = require('../models/dock-pool')
const RabbitMQ = require('../../common/models/astral-rabbitmq')

const PoolDockDisassociate = {}

module.exports = PoolDockDisassociate

/**
 * 1. get random server from pool ASG
 * 2. detach it it
 */

PoolDockDisassociate.jobSchema = joi.object({
  githubOrgId: joi.number().required()
}).unknown().required()

PoolDockDisassociate.task = (job) => {
  return DockPool.getRandomInstance()
    .tap((instanceId) => {
      return DockPool.detachInstanceFromPool(instanceId)
    })
    .tap((instanceId) => {
      return Promise.using(RabbitMQ.getClient(), (publisher) => {
        return publisher.publishTask('dock.attach', {
          instanceId: instanceId,
          githubOrgId: job.githubOrgId
        })
      })
    })
}
