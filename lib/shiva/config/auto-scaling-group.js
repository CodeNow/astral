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
  },

  /**
   * Default AWS SDK options for removing Auto-Scaling Groups.
   * @type {object}
   */
  remove: {
    ForceDelete: false
  }
};
