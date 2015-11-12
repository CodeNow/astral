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

        describe('AWS createAutoScalingGroupAsync request', function() {
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

          it('should set the correct launch configuration name', function(done) {
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

          it('should set and propogate the role tag', function(done) {
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

          it('should set the propogated org tag', function(done) {
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
        }); // end 'AWS createAutoScalingGroupAsync request'
      }); // end 'create'

      describe('get', function() {
        it('should throw if `name` is not a string', function(done) {
          AutoScalingGroup.get({}).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*string/);
            done();
          });
        });

        it('should throw if `name` is empty', function(done) {
          AutoScalingGroup.get('').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*empty/);
            done();
          });
        });

        it('should throw if `options` is not an object', function(done) {
          AutoScalingGroup.get('neat', 'FOOL').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('options');
            expect(err.message).to.match(/options.*object/);
            done();
          });
        });

        it('should call `describeAutoScalingGroupsAsync`', function(done) {
          AutoScalingGroup.get('wowie')
            .then(function () {
              expect(AutoScaling.describeAutoScalingGroupsAsync.calledOnce)
                .to.be.true();
              done();
            })
            .catch(done);
        });

        describe('AWS describeAutoScalingGroups request', function() {
          it('should use the given name', function(done) {
            var name = 'ok-computer';
            AutoScalingGroup.get(name)
              .then(function () {
                var options = AutoScaling.describeAutoScalingGroupsAsync
                  .firstCall.args[0];
                expect(options.AutoScalingGroupNames).to.deep.equal([name]);
                done();
              })
              .catch(done);
          });

          it('should use given override options', function(done) {
            var maxRecords = 10;
            AutoScalingGroup.get('awesomeeeee', { MaxRecords: 10 })
              .then(function () {
                var options = AutoScaling.describeAutoScalingGroupsAsync
                  .firstCall.args[0];
                expect(options.MaxRecords).to.equal(maxRecords);
                done();
              })
              .catch(done);
          });

          it('should cast AWS errors', function(done) {
            var awsErr = new Error('holy cowballs');
            AutoScaling.describeAutoScalingGroupsAsync
              .returns(Promise.reject(awsErr));
            AutoScalingGroup.get('wowownns').asCallback(function (err) {
              expect(err).to.exist();
              expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
              done();
            });
          });
        }); // end 'AWS describeAutoScalingGroups request'
      }); // end 'get'

      describe('remove', function() {
        beforeEach(function (done) {
          sinon.spy(AutoScalingGroup, 'update');
          done();
        });

        afterEach(function (done) {
          AutoScalingGroup.update.restore();
          done();
        });

        it('should throw with non-string `name`', function(done) {
          AutoScalingGroup.remove({}).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*string/);
            done();
          });
        });

        it('should throw with empty `name`', function(done) {
          AutoScalingGroup.remove('').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*empty/);
            done();
          });
        });

        it('should throw with non-object `options`', function(done) {
          AutoScalingGroup.remove('foo', 'awesome').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('options');
            expect(err.message).to.match(/options.*object/);
            done();
          });
        });

        it('should completely scale down the group', function(done) {
          AutoScalingGroup.remove('foo')
            .then(function () {
              expect(AutoScalingGroup.update.calledOnce).to.be.true();
              expect(AutoScalingGroup.update.firstCall.args[1]).to.deep.equal({
                DesiredCapacity: 0,
                MinSize: 0,
                MaxSize: 0
              });
              done();
            })
            .catch(done);
        });

        it('should call deleteAutoScalingGroupAsync', function(done) {
          AutoScalingGroup.remove('happinessfadingwithyouth')
            .then(function () {
              expect(AutoScaling.deleteAutoScalingGroupAsync.calledOnce)
                .to.be.true();
              done();
            })
            .catch(done);
        });

        describe('AWS deleteAutoScalingGroupAsync request', function() {
          it('should set the correct name', function(done) {
            var name = 'everythingdies';
            AutoScalingGroup.remove(name)
              .then(function () {
                var options = AutoScaling.deleteAutoScalingGroupAsync
                  .firstCall.args[0];
                expect(options.AutoScalingGroupName).to.deep.equal(name);
                done();
              })
              .catch(done);
          });

          it('should use the default options', function(done) {
            AutoScalingGroup.remove('thestrongoppresstheweak')
              .then(function () {
                var options = AutoScaling.deleteAutoScalingGroupAsync
                  .firstCall.args[0];
                expect(options.ForceDelete)
                  .to.equal(AutoScalingGroupConfig.remove.ForceDelete);
                done();
              })
              .catch(done);
          });

          it('should use the override options', function(done) {
            var override = { neato: 'cool' };
            AutoScalingGroup.remove('capitalismperpetuatesslavery', override)
              .then(function () {
                var options = AutoScaling.deleteAutoScalingGroupAsync
                  .firstCall.args[0];
                expect(options.neato).to.equal(override.neato);
                done();
              })
              .catch(done);
          });

          it('should cast aws errors', function(done) {
            var awsErr = new Error('lifeisshortandbrutal');
            AutoScaling.deleteAutoScalingGroupAsync
              .returns(Promise.reject(awsErr));
            AutoScalingGroup.remove('theseaisrising').asCallback(function (err) {
              expect(err).to.exist();
              expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
              done();
            });
          });
        }); // end 'AWS deleteAutoScalingGroupAsync request'
      }); // end 'remove'

      describe('update', function() {
        it('should throw with non-string `name`', function(done) {
          AutoScalingGroup.update([]).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*string/);
            done();
          });
        });

        it('should throw with empty `name`', function(done) {
          AutoScalingGroup.update('').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('name');
            expect(err.message).to.match(/name.*empty/);
            done();
          });
        });

        it('should throw with non-object `options`', function(done) {
          AutoScalingGroup.update('creativity', 'joy').asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('options');
            expect(err.message).to.match(/options.*object/);
            done();
          });
        });

        it('should throw with empty `options`', function(done) {
          AutoScalingGroup.update('connectedness', {}).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.argumentName).to.equal('options');
            expect(err.message).to.match(/options.*empty/);
            done();
          });
        });

        it('should call updateAutoScalingGroupAsync', function(done) {
          AutoScalingGroup.update('youwillattainyourdreams', {good: 'work'})
            .then(function () {
              expect(AutoScaling.updateAutoScalingGroupAsync.calledOnce)
                .to.be.true();
              done();
            })
            .catch(done);
        });

        describe('AWS updateAutoScalingGroupAsync request', function() {
          it('should set the correct name', function(done) {
            var name = 'someonelovesyou';
            AutoScalingGroup.update(name, {you: 'areawesome'})
              .then(function () {
                var requestOpts = AutoScaling.updateAutoScalingGroupAsync
                  .firstCall.args[0];
                expect(requestOpts.AutoScalingGroupName).to.equal(name);
                done();
              })
              .catch(done);
          });

          it('should set given options', function(done) {
            var opts = {
              DefaultCooldown: 12000,
              MaxSize: 120,
              MinSize: 1,
              DesiredCapacity: 50
            };
            AutoScalingGroup.update('everydayisablessing', opts)
              .then(function () {
                var requestOpts = AutoScaling.updateAutoScalingGroupAsync
                  .firstCall.args[0];
                Object.keys(opts).forEach(function (key) {
                  expect(requestOpts[key]).to.equal(opts[key]);
                });
                done();
              })
              .catch(done);
          });

          it('should cast errors', function(done) {
            var awsErr = new Error('lifeisbeautiful');
            AutoScaling.updateAutoScalingGroupAsync
              .returns(Promise.reject(awsErr));
            AutoScalingGroup.update('warmth', {greatness: 'awaits'})
              .asCallback(function (err) {
                expect(err).to.exist();
                expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
                done();
              });
          });
        }); // end 'AWS updateAutoScalingGroupAsync request'
      }); // end 'update'
    }); // end 'AutoScalingGroup'
  }); // end 'models'
}); // end 'shiva'
