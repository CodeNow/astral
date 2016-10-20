'use strict'
const Code = require('code')
const Lab = require('lab')
const loadenv = require('loadenv')
const sinon = require('sinon')
const WorkerError = require('error-cat/errors/worker-error')
const awsSDK = require('aws-sdk')
const ssm = new awsSDK.SSM()
require('sinon-as-promised')(require('bluebird'))

const astralRequire = require('../../../../test/fixtures/astral-require')
const SendCommand = astralRequire('shiva/models/send-command')
const Util = astralRequire('shiva/models/util')
const lab = exports.lab = Lab.script()
loadenv.restore()

const afterEach = lab.afterEach
const beforeEach = lab.beforeEach
const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

let testParams
let userDataScript = [ '#!/bin/bash',
  '',
  'DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh',
  '',
  '# Set the hostname for consul',
  'CONSUL_HOSTNAME=localhost',
  'export CONSUL_HOSTNAME',
  '',
  '# Initialize the dock',
  'bash $DOCK_INIT_SCRIPT >> /var/log/user-script-dock-init.log 2>&1',
  ''
]

describe('shiva dock-pool unit test', () => {
  const ssm = SendCommand.getSSM()
  beforeEach((done) => {
    testParams = {
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: ['i-awsinstance'],
      Parameters: {
        commands: userDataScript,
        executionTimeout: ['3600']
      }
    }
    done()
  })

  describe('send dock init command to AWS', () => {
    describe('successful send', () => {
      beforeEach((done) => {
        sinon.stub(ssm, 'sendCommand').yields()
        done()
      })

      afterEach((done) => {
        ssm.sendCommand.restore()
        done()
      })

      it('should call ssm.sendCommand correctly', (done) => {
        SendCommand.sendDockInitCommand(['i-awsinstance']).asCallback((err) => {
          if (err) {
            return done(err)
          }
          sinon.assert.calledOnce(ssm.sendCommand)
          sinon.assert.calledWith(ssm.sendCommand, testParams)
          done()
        })
      })
    })

    describe('unsuccessful send', () => {
      beforeEach((done) => {
        sinon.stub(ssm, 'sendCommand').yields(new Error())
        sinon.stub(Util, 'castAWSError')
        done()
      })

      afterEach((done) => {
        ssm.sendCommand.restore()
        Util.castAWSError.restore()
        done()
      })

      it('should throw an error to the util aws error handler', (done) => {
        SendCommand.sendDockInitCommand(['i-awsinstance']).asCallback((err) => {
          sinon.assert.calledOnce(ssm.sendCommand)
          sinon.assert.calledOnce(Util.castAWSError)
          Util.castAWSError.calledWithExactly(err)
          done()
        })
      })
    }) // end unsuccessful Send
  }) // end 'send dock command'
}) // end 'shiva'
