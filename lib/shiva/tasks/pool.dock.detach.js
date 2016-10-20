'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')

const DockPool = require('../models/dock-pool')
const publisher = require('../../common/models/astral-rabbitmq')

const PoolDockDetach = {}

module.exports = PoolDockDetach

PoolDockDetach.jobSchema = joi.object({
  githubOrgId: joi.number().required()
}).unknown().required()

PoolDockDetach.task = (job) => {
  return DockPool.detachRandomInstance()
    .tap((instanceId) => {
      return publisher.publishTask('dock.attach', {
        instanceId: instanceId,
        githubOrgId: job.githubOrgId
      })
    })
}
