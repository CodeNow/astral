'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

const ec2 = require('../models/aws/ec2')
const logger = require('../logger')
const moment = require('moment')
const publisher = require('../../common/models/astral-rabbitmq')
const schemas = require('../../common/models/schemas.js')
const WorkerStopError = require('error-cat/errors/worker-stop-error')

/**
 * Task handler for the `iam.oldest.launch-time` task.  This task fetches all of the instances from EC2, finds the
 * oldest LaunchTime, and schedules an iam.cleanup on that date
 * @module astral:shiva:tasks
 */
const OldestLaunchTime = {}

module.exports = OldestLaunchTime

OldestLaunchTime.jobSchema = schemas.oldestLaunchTime

OldestLaunchTime.task = () => {
  const log = logger.child({ module: 'IAM Fetch Oldest Dock' })
  var ipSearchFilters = {
    Filters: [
      { Name: 'tag:role', Values: [ 'dock' ] }
    ]
  }
  return ec2.describeInstancesAsync(ipSearchFilters)
    .get('Reservations')
    .tap(reservations => {
      if (!reservations.length) {
        throw new WorkerStopError('Somehow we got no reservations in EC2')
      }
    })
    .then(reservations => {
      return reservations.reduce((allInstances, reservation) => {
        return reservation.Instances.reduce((allInstances, instance) => {
          allInstances.push(instance)
          return allInstances
        }, allInstances)
      }, [])
    })
    .then(allInstances => {
      const removeBefore = allInstances.reduce((earliestDate, instance) => {
        const launchTime = moment(instance.LaunchTime)
        return (earliestDate < launchTime) ? earliestDate : launchTime
      }, moment(Date.now()))

      log.info({ removeBefore }, 'removing all users created before this date')
      return publisher.publishTask('iam.cleanup', { removeBefore: removeBefore.toISOString() })
    })
}
