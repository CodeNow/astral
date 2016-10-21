'use strict'
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' })
const awsSDK = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')

const Util = require('./util')

const ssm = new awsSDK.SSM()
const rawUserData = fs.readFileSync(path.resolve(__dirname, '../scripts/aws-instance-user-data.sh'))
const rawScript = new Buffer(rawUserData).toString()
const userDataScript = rawScript.replace(/{{consul_hostname}}/g, process.env.CONSUL_HOSTNAME).split('\n')

module.exports = class SendCommand {
  static getSSM () {
    return ssm
  }

  /**
   * @param    {String}  instanceId
   * @return   {Promise}
   * @resolves {String} data from aws callback
   */
  static sendDockInitCommand (instanceId) {
    const params = {
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: [ instanceId ],
      Parameters: {
        commands: userDataScript,
        executionTimeout: [ `${process.env.DOCK_INIT_RUNTIME_TIMEOUT}` ]
      }
    }

    return Promise.fromCallback((cb) => {
      ssm.sendCommand(params, cb)
    })
    .catch(Util.castAWSError)
  }
}
