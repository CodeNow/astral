'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')
const Promise = require('bluebird')

const SendCommand = require('../models/send-command')
/**
 * Task handler for the `dock.attach` task.
 * @module astral:shiva:tasks
 */

const dockInitialize = {}

module.exports = dockInitialize

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

dockInitialize.jobSchema = joi.object({
  AutoScalingGroupName: joi.string().required(),
  InstanceIds: joi.array().items(joi.string()).required()
}).unknown().required()

dockInitialize.task = (job) => {
  return Promise
    .try(() => {
      return SendCommand.sendDockInitCommand(job.InstanceIds)
    })
}
