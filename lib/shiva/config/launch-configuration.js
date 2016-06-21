'use strict'

var trim = require('trim')

/**
 * Default options for LaunchConfiguration aws requests.
 * @module astral:shiva:config
 */
module.exports = {
  /**
   * Default AWS SDK options for creating launch configurations.
   * @type {object}
   */
  create: {
    AssociatePublicIpAddress: false,
    ImageId: process.env.AWS_INSTANCE_IMAGE_ID,
    InstanceType: process.env.AWS_INSTANCE_TYPE,
    KeyName: process.env.AWS_SSH_KEY_NAME,
    PlacementTenancy: process.env.AWS_PLACEMENT_TENANCY,
    SecurityGroups: process.env.AWS_DOCK_SECURITY_GROUPS.split(',').map(trim)
  }
}
