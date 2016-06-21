'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var Code = require('code')
var expect = Code.expect
var sinon = require('sinon')

var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var Promise = require('bluebird')
var TaskFatalError = require('ponos').TaskFatalError
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group')
var shivaASGDelete = astralRequire('shiva/tasks/asg.delete')

describe('shiva', function () {
  describe('tasks', function () {
    describe('asg.delete', function () {
      beforeEach(function (done) {
        sinon.stub(AutoScalingGroup, 'remove').returns(Promise.resolve())
        done()
      })

      afterEach(function (done) {
        AutoScalingGroup.remove.restore()
        done()
      })

      it('should fatally reject with non-object job', function (done) {
        shivaASGDelete('neat').asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError)
          expect(err.message).to.match(/non-object.*job/)
          done()
        })
      })

      it('should fatally reject without string `githubId`', function (done) {
        shivaASGDelete({}).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError)
          expect(err.message).to.match(/githubId.*string/)
          done()
        })
      })

      it('should fatally reject with an empty `githubId`', function (done) {
        shivaASGDelete({ githubId: '' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError)
          expect(err.message).to.match(/githubId.*empty/)
          done()
        })
      })

      it('should call AutoScalingGroup.remove', function (done) {
        var name = '62738729'
        shivaASGDelete({ githubId: name }).asCallback(function (err) {
          expect(err).to.not.exist()
          expect(AutoScalingGroup.remove.calledWith(name)).to.be.true()
          done()
        })
      })
    }) // end 'asg.delete'
  }) // end 'tasks'
}) // end 'shiva'
