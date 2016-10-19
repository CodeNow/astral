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

  asgCreate: joi.object({
    githubId: joi.string().required()
  }).unknown().required()
}
