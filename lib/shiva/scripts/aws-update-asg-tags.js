require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const Promise = require('bluebird')
const AutoScalingGroup = require('../models/auto-scaling-group')

return Promise
    .try(function () {
      const name = AutoScalingGroup._getName(orgId)
      return AutoScalingGroup.createOrUpdateTags(orgId, {
        Tags: [
          {
            ResourceId: name,
            ResourceType: 'auto-scaling-group',
            Key: 'runnable-org-id',
            Value: bigPoppaId,
            PropagateAtLaunch: true
          }
        ]
      })
    })
    .then(function (res) {
      console.log(res)
    })
