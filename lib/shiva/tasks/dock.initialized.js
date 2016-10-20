'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')
const Promise = require('bluebird')
const publisher = require('../../common/models/astral-rabbitmq')

/**
 * Task handler for the `dock.attach` task.
 * @module astral:shiva:tasks
 */

const DockInitialized = {}

module.exports = DockInitialized

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

DockInitialized.jobSchema = joi.object({
  autoScalingGroupName: joi.string().required(),
  instanceId: joi.string().required()
}).unknown().required()

DockInitialized.publishEvent = (job) => {
  return Promise
    .try(() => {
      return publisher.publishTask('dock.initialized', {
        autoScalingGroupName: job.autoScalingGroupName,
        instanceId: job.instanceId
      })
    })
}
