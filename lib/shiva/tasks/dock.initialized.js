'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const Promise = require('bluebird')
const publisher = require('../../common/models/astral-rabbitmq')

/**
 * Task handler for the `dock.initialized` task.
 * @module astral:shiva:tasks
 */

const DockInitialized = {}

module.exports = DockInitialized

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

DockInitialized.publishEvent = (job) => {
  return Promise
    .try(() => {
      let githubOrgId = job.autoScalingGroupName.split('-').pop()
      return publisher.publishTask('dock.initialized', {
        autoScalingGroupName: job.autoScalingGroupName,
        githubOrgId: githubOrgId,
        instanceId: job.instanceId
      })
    })
}
