'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')
const Promise = require('bluebird')

const AutoScalingGroup = require('../models/auto-scaling-group')
const SendCommand = require('../models/send-command')
/**
 * Task handler for the `dock.attach` task.
 * @module astral:shiva:tasks
 */

const dockAttach = {}

module.exports = dockAttach

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

dockAttach.jobSchema = joi.object({
  githubOrgId: joi.number().required(),
  instanceId: joi.string().required()
}).unknown().required()

dockAttach.task = (job) => {
  return Promise
    .try(() => {
      let orgId = process.env.AWS_AUTO_SCALING_GROUP_PREFIX + job.githubOrgId
      let instanceIds = [job.instanceId]
      return AutoScalingGroup.attachInstance(orgId, instanceIds)
    })
    .then(() => {
      return SendCommand.sendDockInitCommand(job.instanceId)
    })
    .then((res) => {

    })
}
