'use strict'
const keypather = require('keypather')()

const AutoScaling = require('./aws/auto-scaling')
const Util = require('./util')
const WorkerError = require('error-cat/errors/worker-error')

module.exports = class DockPool {
  /**
   * @return   {Promise}
   * @resolves {String} detached instance id
   */
  static detachRandomInstance () {
    return DockPool._getRandomInstance()
      .tap((instanceId) => {
        return DockPool._detachInstanceFromPool(instanceId)
      })
  }

  /**
   * @return {Promise}
   * @resolves {String} instanceId
   */
  static _getRandomInstance () {
    return AutoScaling.describeAutoScalingGroupsAsync({
      AutoScalingGroupNames: process.env.DOCK_POOL_ASG_NAME
    })
    .catch(Util.castAWSError)
    .then(DockPool._getInstancesFromASG)
    .then(DockPool._findValidInstanceIdFromInstances)
  }

  /**
   * @param  {AutoScalingGroups[]} asgInfo
   * @return {Instances[]}
   */
  static _getInstancesFromASG (asgInfo) {
    const instances = keypather.get(asgInfo, 'AutoScalingGroups[0].Instances')
    if (!instances || instances.length === 0) {
      throw new WorkerError('no instances available in dock pool', { asgInfo })
    }
    return instances
  }

  /**
   * @param  {Instances[]}  instances
   * @return {String}
   */
  static _findValidInstanceIdFromInstances (instances) {
    const outInstance = instances.find(DockPool._isValidInstance)
    if (!outInstance) {
      throw new WorkerError('no healthy instance available in dock pool', { instances })
    }

    return outInstance.InstanceId
  }

  /**
   * @param  {Instance}  instance
   * @return {Boolean} true if instance is healthy and ready to use
   */
  static _isValidInstance (instance) {
    return instance.HealthStatus === 'Healthy' && instance.LifecycleState === 'InService'
  }

  /**
   * @param    {String}  instance
   * @return   {Promise}
   * @resolves {undefined}
   */
  static _detachInstanceFromPool (instanceId) {
    return AutoScaling.detachInstancesAsync({
      AutoScalingGroupName: process.env.DOCK_POOL_ASG_NAME,
      InstanceIds: [ instanceId ],
      ShouldDecrementDesiredCapacity: false
    })
  }
}
