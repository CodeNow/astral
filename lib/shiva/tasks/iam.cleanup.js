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

iamCleanup.jobSchema = schemas.iamCleanup

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
  const log = logger.child({ module: 'IAM Cleanup' })
  const removeBefore = moment(job.removeBefore)
  return iam.listUsersAsync({ MaxItems: process.env.IAM_USER_FETCH })
    .get('Users')
    .filter(user => user.UserName.includes('vault-root-s3') && moment(user.CreateDate) < removeBefore)
    .then(users => [users[0]])
    .each(user => {
      log.info({ user }, 'deleting user policy from IAM')
      return iam.deleteAllUserPoliciesAsync({ UserName: user.UserName })
    })
    .each(user => {
      log.info({ user }, 'deleting user access key from IAM')
      return iam.deleteAllUserAccessKeysAsync({ UserName: user.UserName })
    })
    .mapSeries(user => {
      log.info({ user }, 'deleting user from IAM')
      return iam.deleteUserAsync({ UserName: user.UserName })
    })
}
