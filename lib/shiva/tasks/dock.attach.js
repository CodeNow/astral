'use strict'
const Promise = require('bluebird')
const WorkerStopError = require('error-cat/errors/worker-stop-error')
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

const AutoScalingGroup = require('../models/auto-scaling-group')
const AWSAlreadyPartOfASGError = require('../errors/aws-already-part-of-asg-error')
const publisher = require('../../common/models/astral-rabbitmq')
const schemas = require('../../common/models/schemas.js')

/**
 * Task handler for the `dock.attach` task.
 * @module astral:shiva:tasks
 */
const DockAttach = {}

module.exports = DockAttach

// takes around 3 seconds to detach so start the wait there
DockAttach.retryDelay = 3000

/**
 * 1. Get the IP and OrgId from the dock disassociate task
 * 2. Add that dock to the organization's auto-scaling group
 */
DockAttach.jobSchema = schemas.dockAttach

DockAttach.task = (job) => {
  const targetASGName = process.env.AWS_AUTO_SCALING_GROUP_PREFIX + job.githubOrgId
  return Promise.try(() => {
    const instanceIds = [job.instanceId]
    return AutoScalingGroup.attachInstance(targetASGName, instanceIds)
  })
  .catch(AWSAlreadyPartOfASGError, (err) => {
    if (err.getCurrentASG() === targetASGName) {
      throw new WorkerStopError('instance already attached to asg', { err, targetASGName })
    }

    throw err
  })
  .then(() => {
    return publisher.publishTask('dock.initialize', {
      autoScalingGroupName: targetASGName,
      instanceId: job.instanceId,
      githubOrgId: job.githubOrgId
    })
  })
}
