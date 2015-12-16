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

var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');
var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var TaskFatalError = require('ponos').TaskFatalError;
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group');
var shivaASGCreate = astralRequire('shiva/tasks/shiva-asg-create');

describe('shiva', function() {
  describe('tasks', function() {
    describe('shiva.asg.create', function() {
      beforeEach(function (done) {
        sinon.stub(AutoScalingGroup, 'create').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        AutoScalingGroup.create.restore();
        done();
      });

      it('should fatally reject with non-object job', function(done) {
        shivaASGCreate('neat').asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object.*job/);
          done();
        });
      });

      it('should fatally reject without string `githubId`', function(done) {
        shivaASGCreate({}).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/githubId.*string/);
          done();
        });
      });

      it('should fatally reject with an empty `githubId`', function(done) {
        shivaASGCreate({ githubId: '' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/githubId.*empty/);
          done();
        });
      });

      it('should call AutoScalingGroup.create', function(done) {
        var name = '12345';
        shivaASGCreate({ githubId: name }).asCallback(function (err) {
          expect(err).to.not.exist();
          expect(AutoScalingGroup.create.calledWith(name)).to.be.true();
          done();
        });
      });
    }); // end 'shiva.asg.create'
  }); // end 'tasks'
}); // end 'shiva'
