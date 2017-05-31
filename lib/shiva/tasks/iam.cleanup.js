'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })

const iam = require('../models/aws/iam')
const logger = require('../logger')
const moment = require('moment')
const schemas = require('../../common/models/schemas.js')

const iamCleanup = {}
/**
 * Task handler for the `iam.cleanup` queue.
 */
module.exports = iamCleanup
const log = logger.child({ module: 'IAM Cleanup' })

module.exports.maxNumRetries = 1

iamCleanup.jobSchema = schemas.iamCleanup

function filterUsers (job) {
  console.log('1111')
  if (job.removeBefore) {
    return user => {
      return moment(user.CreateDate).isBefore(job.removeBefore)
    }
  }

  if (job.ownedBy) {
    return user => {
      return user.UserName.includes('-' + job.ownedBy + '-')
    }
  }

  if (job.ownedByList) {
    return user => {
      return job.ownedByList.find(orgId => {
        return user.UserName.includes('-' + orgId + '-')
      })
    }
  }
}

function deleteUser (user) {
  log.info({ user }, 'deleting user policy from IAM')
  return iam.deleteAllUserPoliciesAsync({ UserName: user.UserName })
    .tap(() => {
      log.info({ user }, 'deleting user access key from IAM')
      return iam.deleteAllUserAccessKeysAsync({ UserName: user.UserName })
    })
    .tap(() => {
      log.info({ user }, 'deleting user from IAM')
      return iam.deleteUserAsync({ UserName: user.UserName })
    })
}
/**
 * This worker fetches the list of IAMs from AWS, and deletes all of the oldest ones
 * @param {Object}  job
 * @param {ISODate} job.removeBefore
 *
 * @throws AWSAlreadyExistsError
 * @throws AWSValidationError
 * @throws AWSInvalidParameterTypeError
 * @throws AWSRateLimitError
 *
 */
iamCleanup.task = (job) => {
  return iam.listAllUsersAsync({ MaxItems: process.env.IAM_USER_FETCH })
    .filter(user => user.UserName.includes('vault-root-s3'))
    .filter(filterUsers(job))
    .each(deleteUser)
}
