
'use strict'
var path = require('path')
var fs = require('fs')
var Promise = require('bluebird')
var readFileAsync = Promise.promisify(fs.readFile)
const awsSDK = require('aws-sdk')
const ssm = new awsSDK.SSM()

const Util = require('./util')

let userDataScript

readFileAsync(path.resolve(__dirname, '../scripts/aws-instance-user-data.sh'))
  .then((raw) => {
    let rawScript = new Buffer(raw).toString()
    rawScript = rawScript.replace(/{{consul_hostname}}/g, process.env.CONSUL_HOSTNAME)
    userDataScript = rawScript.split('\n')
  })

module.exports = class SendCommand {

  static getSSM () {
    return ssm
  }

  /**
   * @param    {String}  instanceId
   * @return   {Promise}
   * @resolves {String} data from aws callback
   */
  static sendDockInitCommand(instanceIds) {
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
      .catch(Util.castAWSError)
  }
}