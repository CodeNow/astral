'use strict'
const joi = require('joi')

module.exports = {
  asgPolicyScaleOutCreate: joi.object({
    githubId: joi.string().required()
  }).unknown().required(),

  dockAttach: joi.object({
    instanceId: joi.string().required(),
    githubOrgId: joi.number().required()
  }).unknown().required(),

  poolDockDetach: joi.object({
    githubOrgId: joi.number().required()
  }).unknown().required(),

  dockInitialize: joi.object({
    autoScalingGroupName: joi.string().required(),
    githubOrgId: joi.number().required(),
    instanceId: joi.string().required()
  }).unknown().required(),

  dockInitialized: module.exports.dockInitialize,

  asgCreate: joi.object({
    githubId: joi.string().required(),
    isPersonalAccount: joi.boolean().required()
  }).unknown().required(),

  oldestLaunchTime: joi.object().unknown(),

  iamCleanup: joi.object({
    removeBefore: joi.date().iso(),
    ownedBy: joi.number(),
    ownedByList: joi.array()
  }).unknown().xor('removeBefore', 'ownedBy', 'ownedByList')
}
