
'use strict'
var path = require('path')
var fs = require('fs')
var Promise = require('bluebird')
const awsSDK = require('aws-sdk')
const ssm = new awsSDK.SSM()

const Util = require('./util')

const rawUserData = fs.readFileSync(path.resolve(__dirname, '../scripts/aws-instance-user-data.sh'))
let rawScript = new Buffer(rawUserData).toString()
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
  static sendDockInitCommand (instanceIds) {
    var params = {
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: instanceIds,
      Parameters: {
        commands: userDataScript,
        executionTimeout: ['3600']
      }
    }

    return Promise.fromCallback((cb) => {
      ssm.sendCommand(params, cb)
    })
    .catch((err) => {
      Util.castAWSError(err)
    })
  }
}
