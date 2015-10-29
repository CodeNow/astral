'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');
var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var defaults = require('101/defaults');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var AutoScaling = astralRequire('shiva/models/aws/auto-scaling');
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group');
var AutoScalingGroupConfig = astralRequire('shiva/config/auto-scaling-group.js');
var InvalidArgumentError = astralRequire('common/errors/invalid-argument-error');
var Util = astralRequire('shiva/models/util');

describe('shiva', function () {
  describe('models', function () {
    describe('AutoScalingGroup', function() {
      beforeEach(function (done) {
        sinon.spy(AutoScalingGroup, '_setLaunchConfigurationName');
        sinon.spy(Util, 'castAWSError');
        sinon.stub(AutoScaling, 'createAutoScalingGroupAsync')
          .returns(Promise.resolve());
        sinon.stub(AutoScaling, 'describeAutoScalingGroupsAsync')
          .returns(Promise.resolve());
        sinon.stub(AutoScaling, 'deleteAutoScalingGroupAsync')
          .returns(Promise.resolve());
        sinon.stub(AutoScaling, 'updateAutoScalingGroupAsync')
          .returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        AutoScalingGroup._setLaunchConfigurationName.restore();
        Util.castAWSError.restore();
        AutoScaling.createAutoScalingGroupAsync.restore();
        AutoScaling.describeAutoScalingGroupsAsync.restore();
        AutoScaling.deleteAutoScalingGroupAsync.restore();
        AutoScaling.updateAutoScalingGroupAsync.restore();
        done();
      });

      describe('_setLaunchConfigurationName', function() {
        it('should set the launch configuration name from the environment', function(done) {
          expect(process.env.AWS_LAUNCH_CONFIGURATION_NAME).to.exist();
          AutoScalingGroup._setLaunchConfigurationName({})
            .then(function (options) {
              expect(options.LaunchConfigurationName)
                .to.equal(process.env.AWS_LAUNCH_CONFIGURATION_NAME);
              done();
            })
            .catch(done);
        });
      });

      describe('create', function() {
        it('should throw with non-string `name`', function(done) {
          AutoScalingGroup.create({}).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*string/);
            done();
          });
        });

        it('should throw with empty `name`', function(done) {
          AutoScalingGroup.create('').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*empty/);
            done();
          });
        });

        it('should throw with non-object `options`', function(done) {
          AutoScalingGroup.create('foo', 'awesome').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('options');
            expect(err.message).to.match(/options.*object/);
            done();
          });
        });

        it('should call aws createAutoScalingGroupAsync', function(done) {
          AutoScalingGroup.create('yaynames')
            .then(function () {
              expect(AutoScaling.createAutoScalingGroupAsync.calledOnce)
                .to.be.true();
              done();
            })
            .catch(done);
        });

        it('should set the correct name', function(done) {
          var name = 'some-name';
          AutoScalingGroup.create(name)
            .then(function () {
              var options = AutoScaling.createAutoScalingGroupAsync.firstCall
                .args[0];
              expect(options.AutoScalingGroupName).to.equal(name);
              done();
            })
            .catch(done);
        });

        it('should use the correct launch configuration name', function(done) {
          AutoScalingGroup.create('weeee')
            .then(function () {
              expect(AutoScalingGroup._setLaunchConfigurationName.calledOnce)
                .to.be.true();
              var options = AutoScaling.createAutoScalingGroupAsync.firstCall
                .args[0];
              var lcName = AutoScalingGroup._setLaunchConfigurationName
                .returnValues[0]._settledValue.LaunchConfigurationName;
              expect(options.LaunchConfigurationName).to.equal(lcName);
              done();
            })
            .catch(done);
        });

        it('should set and propogate the role tag as `dock`', function(done) {
          AutoScalingGroup.create('weeee')
            .then(function () {
              var options = AutoScaling.createAutoScalingGroupAsync.firstCall
                .args[0];
              var tag = options.Tags.find(function (tag) {
                return tag.PropagateAtLaunch === true && tag.Key === 'role';
              })
              expect(tag).to.exist();
              expect(tag.Value).to.equal('dock');
              done();
            })
            .catch(done);
        });

        it('should set the propogated org tag to the given name', function(done) {
          var name = ' this is a nammmeezzz ';
          AutoScalingGroup.create(name)
            .then(function () {
              var options = AutoScaling.createAutoScalingGroupAsync.firstCall
                .args[0];
              var tag = options.Tags.find(function (tag) {
                return tag.PropagateAtLaunch === true && tag.Key === 'org';
              });
              expect(tag).to.exist();
              expect(tag.Value).to.equal(name);
              done();
            })
            .catch(done);
        });

        it('should cast aws errors', function(done) {
          var awsErr = new Error('holy cowballs');
          AutoScaling.createAutoScalingGroupAsync
            .returns(Promise.reject(awsErr));
          AutoScalingGroup.create('wowownns').asCallback(function (err) {
            expect(err).to.exist();
            expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
            done();
          });
        });
      }); // end 'create'

      describe('get', function() {
        // body...
      }); // end 'get'

      describe('remove', function() {
        // body...
      }); // end 'remove'

      describe('update', function() {
        // body...
      }); // end 'update'

    }); // end 'AutoScalingGroup'
  }); // end 'models'
}); // end 'shiva'
