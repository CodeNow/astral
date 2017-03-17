'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
const moment = require('moment')
var sinon = require('sinon')

var astralRequire = require(
  process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var Promise = require('bluebird')
require('sinon-as-promised')(Promise)

var iam = astralRequire('shiva/models/aws/iam')
var iamCleanup = astralRequire('shiva/tasks/iam.cleanup')

describe('shiva', function () {
  describe('tasks', function () {
    let oldUser
    let currentUser
    let newUser
    let notS3User
    describe('iam.cleanup', function () {
      beforeEach(function (done) {
        oldUser = {
          UserName: 'vault-root-s3-8081',
          Path: '/',
          CreateDate: moment(Date.now()).subtract(4, 'months').toISOString(),
          UserId: 'ABC',
          Arn: 'arn:aws:iam::123:user/vault-token-123-8081'
        }
        currentUser = {
          UserName: 'vault-root-s3-1234',
          Path: '/',
          CreateDate: moment(Date.now()).subtract(1, 'months').toISOString(),
          UserId: 'ABC',
          Arn: 'arn:aws:iam::123:user/vault-token-123-8081'
        }
        newUser = {
          UserName: 'vault-root-s3-23423',
          Path: '/',
          CreateDate: moment(Date.now()).toISOString(),
          UserId: '1234',
          Arn: 'arn:aws:iam::123:user/vault-token-342342-8081'
        }
        notS3User = {
          UserName: 'vault-token-34123-23423',
          Path: '/',
          CreateDate: moment(Date.now()).toISOString(),
          UserId: '1234',
          Arn: 'arn:aws:iam::123:user/vault-token-342342-8081'
        }
        sinon.stub(iam, 'listUsersAsync').resolves({
          Users: [oldUser, currentUser, newUser, notS3User]
        })
        sinon.stub(iam, 'deleteAllUserPoliciesAsync').resolves()
        sinon.stub(iam, 'deleteAllUserAccessKeysAsync').resolves()
        sinon.stub(iam, 'deleteUserAsync').resolves()
        done()
      })

      afterEach(function (done) {
        iam.listUsersAsync.restore()
        iam.deleteUserAsync.restore()
        iam.deleteAllUserPoliciesAsync.restore()
        iam.deleteAllUserAccessKeysAsync.restore()
        done()
      })
      it('should fetch IAM_USER_FETCH users', function (done) {
        let removeBefore = moment(new Date()).subtract(3, 'months').toISOString()
        iamCleanup
          .task({ removeBefore })
          .asCallback(() => {
            sinon.assert.calledWith(iam.listUsersAsync, { MaxItems: process.env.IAM_USER_FETCH })
            done()
          })
      })

      it('should filter out oldUser', function (done) {
        let removeBefore = moment(new Date()).subtract(2, 'months').toISOString()
        iamCleanup
          .task({ removeBefore })
          .asCallback(() => {
            sinon.assert.callCount(iam.deleteUserAsync, 1)
            sinon.assert.calledWith(iam.deleteUserAsync, { UserName: oldUser.UserName })
            sinon.assert.neverCalledWith(iam.deleteUserAsync, { UserName: notS3User.UserName })
            sinon.assert.neverCalledWith(iam.deleteUserAsync, { UserName: currentUser.UserName })
            sinon.assert.neverCalledWith(iam.deleteUserAsync, { UserName: newUser.UserName })
            done()
          })
      })

      it('should call everything with the same input', function (done) {
        let removeBefore = moment(new Date()).subtract(2, 'months').toISOString()
        iamCleanup
          .task({ removeBefore })
          .asCallback(() => {
            sinon.assert.callCount(iam.deleteUserAsync, 1)
            sinon.assert.calledWith(iam.deleteAllUserPoliciesAsync, { UserName: oldUser.UserName })
            sinon.assert.calledWith(iam.deleteAllUserAccessKeysAsync, { UserName: oldUser.UserName })
            sinon.assert.calledWith(iam.deleteUserAsync, { UserName: oldUser.UserName })
            done()
          })
      })

      it('should call everything in order', function (done) {
        let removeBefore = moment(new Date()).subtract(2, 'months').toISOString()
        iamCleanup
          .task({ removeBefore })
          .asCallback(() => {
            sinon.assert.callOrder(
              iam.deleteAllUserPoliciesAsync,
              iam.deleteAllUserAccessKeysAsync,
              iam.deleteUserAsync
            )
            done()
          })
      })
    })
  })
})
