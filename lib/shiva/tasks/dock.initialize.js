'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const Promise = require('bluebird')

const SendCommand = require('../models/send-command')
const publisher = require('../../common/models/astral-rabbitmq')

/**
 * Task handler for the `dock.attach` task.
 * @module astral:shiva:tasks
 */

const DockInitialize = {}

module.exports = DockInitialize

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

DockInitialize.task = (job) => {
  return Promise.try(() => {
    return SendCommand.sendDockInitCommand(job.InstanceIds)
  })
  .then(() => {
    return publisher.publishTask('dock.initialized', {
      autoScalingGroupName: job.autoScalingGroupName,
      instanceId: job.instanceId,
      githubOrgId: job.githubOrgId
    })
  })
}
