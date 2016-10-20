'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')
const Promise = require('bluebird')

const DockInitialized = require('./dock.initialized.js')
const SendCommand = require('../models/send-command')
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

DockInitialize.jobSchema = joi.object({
  AutoScalingGroupName: joi.string().required(),
  InstanceIds: joi.array().items(joi.string()).required()
}).unknown().required()

DockInitialize.task = (job) => {
  return Promise
    .try(() => {
      return SendCommand.sendDockInitCommand(job.InstanceIds)
    })
    .then(() => {
      let instanceId = job.InstanceIds[0]
      return DockInitialized.publishEvent({
        autoScalingGroupName: job.AutoScalingGroupName,
        instanceId: instanceId
      })
    })
}
