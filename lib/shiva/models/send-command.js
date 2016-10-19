
'use strict'
var path = require('path')
var fs = require('fs')
var Promise = require('bluebird')
var readFileAsync = Promise.promisify(fs.readFile)
const awsSDK = require('aws-sdk')
const ssm = new awsSDK.SSM()

let userDataScript = null

module.exports = class SendCommand {

  /**
   * @return   {Promise}
   * @resolves {Array} AWS 'StringList' array of bash commands
   */
  static _getDockInitCommand () {
    return Promise
      .try(() => {
        if (userDataScript) {
          return userDataScript
        }

        let templatePath = path.resolve(
          __dirname,
          '../scripts/aws-instance-user-data.sh'
        )
        return readFileAsync(templatePath)
      })
      .then((raw) => {
        userDataScript = new Buffer(raw).toString().replace(/{{consul_hostname}}/g, process.env.CONSUL_HOSTNAME)
        return userDataScript.split('\n')
      })
  }

  /**
   * @param    {String}  instanceId
   * @return   {Promise}
   * @resolves {String} data from aws callback
   */
  static sendDockInitCommand (instanceId) {
    return SendCommand._getDockInitCommand()
      .then((dockInitCommand) => {
        var params = {
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [ instanceId ],
          Parameters: {
            commands: dockInitCommand,
            executionTimeout: ['3600']
          }
        }

        return ssm.sendCommand(params, function(err,data) {
          if (err) {
            throw err
          }
          return data
        })
      })
    }

  }
