'use strict'

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const joi = require('joi')
const AutoScalingGroup = require('../config/auto-scaling-group.js')
const RabbitMQ = require('../../common/models/astral-rabbitmq')
var WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Task handler for the `dock.associate` task.
 * @module astral:shiva:tasks
 */

const PoolDockAssociate = {}

module.exports = PoolDockAssociate

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */

PoolDockAssociate.jobSchema = joi.object({
  githubOrgId: joi.number().required(),
  instanceId: joi.string().required()
}).unknown().required()

PoolDockAssociate.task = (job) => {
  return Promise
    .try((job) => {
      let orgId = job.githubOrgId.toString()
      let instanceIds = [job.instanceId]
      return AutoScalingGroup.attachInstances(orgId, instanceIds),
    })
  .then((res) => {
    return Pomise.using(RabbitMQ.getClient(), (publisher) => {
      return publisher.publishTask('dock.attached', {
        githubOrgId: job.githubOrgId,
        instanceId: job.instanceId
      })
    })
  })
  .catch((err) => {
    throw new WorkerStopError(
      'Error publishing new task'
    )
  })
}