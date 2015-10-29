'use strict';

/**
 * Default options for AutoScalingGroup aws requests.
 * @module astral:shiva:config
 */
module.exports = {
  /**
   * Default AWS SDK options for creating Auto-Scaling Groups.
   * @type {object}
   */
  create: {
    // TODO Explore the rest of the options and provide sensible defaults...
    MinSize: process.env.AWS_AUTO_SCALING_GROUP_MIN_SIZE,
    MaxSize: process.env.AWS_AUTO_SCALING_GROUP_MAX_SIZE,
    DesiredCapacity: process.env.AWS_AUTO_SCALING_GROUP_DESIRED_CAPACITY,
    VPCZoneIdentifier: process.env.AWS_AUTO_SCALING_GROUP_SUBNETS
  },

  /**
   * Default AWS SDK options for removing Auto-Scaling Groups.
   * @type {object}
   */
  remove: {
    ForceDelete: false
  }
};
