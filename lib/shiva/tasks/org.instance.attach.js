'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')
const Promise = require('bluebird')
const AutoScalingGroup = require('../models/auto-scaling-group.js')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Task handler for the `dock.associate` task.
 * @module astral:shiva:tasks
 */

const OrgInstanceAttach = {}

module.exports = OrgInstanceAttach

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

OrgInstanceAttach.jobSchema = joi.object({
  githubOrgId: joi.string().required(),
  instanceId: joi.string().required()
}).unknown().required()

OrgInstanceAttach.task = (job) => {
  return Promise
    .try(() => {
      return joi.validate(job, OrgInstanceAttach.jobSchema, (err, value) => {
        if (!err) {
          return value
        }
        throw new WorkerStopError(
          'Error processing attach task',
          {err: err, job: job}
        )
      })
    })
    .then((validatedJob) => {
      let orgId = process.env.AWS_AUTO_SCALING_GROUP_PREFIX + validatedJob.githubOrgId
      let instanceIds = [validatedJob.instanceId]
      return AutoScalingGroup.attachInstances(orgId, instanceIds)
    })
}
