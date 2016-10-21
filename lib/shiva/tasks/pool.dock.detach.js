'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

const DockPool = require('../models/dock-pool')
const publisher = require('../../common/models/astral-rabbitmq')
const schemas = require('../../common/models/schemas.js')

const PoolDockDetach = {}

module.exports = PoolDockDetach

PoolDockDetach.jobSchema = schemas.poolDockDetach

PoolDockDetach.task = (job) => {
  return DockPool.detachRandomInstance()
    .tap((instanceId) => {
      return publisher.publishTask('dock.attach', {
        instanceId: instanceId,
        githubOrgId: job.githubOrgId
      })
    })
}
