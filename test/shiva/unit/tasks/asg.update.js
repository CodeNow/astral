'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

var astralRequire = require(
  process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');
var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var TaskFatalError = require('ponos').TaskFatalError;
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group');
var shivaASGUpdate = astralRequire('shiva/tasks/asg.update');

describe('shiva', function() {
  describe('tasks', function() {
    describe('asg.update', function() {
      beforeEach(function (done) {
        sinon.stub(AutoScalingGroup, 'update').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        AutoScalingGroup.update.restore();
        done();
      });

      it('should fatally reject with non-object job', function(done) {
        shivaASGUpdate('neat').asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object.*job/);
          done();
        });
      });

      it('should fatally reject without string `githubId`', function(done) {
        shivaASGUpdate({}).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/githubId.*string/);
          done();
        });
      });

      it('should fatally reject with an empty `githubId`', function(done) {
        shivaASGUpdate({ githubId: '' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/githubId.*empty/);
          done();
        });
      });

      it('should fatally reject with non-object `data`', function (done) {
        var job = { githubId: 'wow', data: 'neat' };
        shivaASGUpdate(job).asCallback(function(err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/data.*object/);
          done();
        });
      });

      it('should call AutoScalingGroup.update', function(done) {
        var githubId = 'agithubidwow';
        var data = { MaxSize: 8, MinSize: 4, DesiredCapacity: 4 };
        var job = { githubId: githubId, data: data };
        shivaASGUpdate(job).asCallback(function (err) {
          expect(err).to.not.exist();
          expect(AutoScalingGroup.update.calledOnce).to.be.true();
          expect(AutoScalingGroup.update.firstCall.args[0]).to.equal(githubId);
          expect(AutoScalingGroup.update.firstCall.args[1]).to.deep.equal(data);
          done();
        });
      });
    }); // end 'asg.update'
  }); // end 'tasks'
}); // end 'shiva'
