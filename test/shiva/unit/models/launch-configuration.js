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
var LaunchConfiguration = astralRequire('shiva/models/launch-configuration');
var LaunchConfigurationConfig = astralRequire('shiva/config/launch-configuration.js');
var InvalidArgumentError = astralRequire('common/errors/invalid-argument-error');
var Util = astralRequire('shiva/models/util');

describe('shiva', function () {
  describe('models', function () {
    describe('LaunchConfiguration', function() {
      beforeEach(function (done) {
        sinon.spy(Util, 'castAWSError');
        sinon.stub(AutoScaling, 'createLaunchConfigurationAsync')
          .returns(Promise.resolve());
        sinon.stub(AutoScaling, 'deleteLaunchConfigurationAsync')
          .returns(Promise.resolve());
        sinon.stub(AutoScaling, 'describeLaunchConfigurationsAsync')
          .returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        Util.castAWSError.restore();
        AutoScaling.createLaunchConfigurationAsync.restore();
        AutoScaling.deleteLaunchConfigurationAsync.restore();
        AutoScaling.describeLaunchConfigurationsAsync.restore();
        done();
      });

      describe('_getUserDataScript', function() {
        var userDataScript;

        before(function (done) {
          var userDataPath = path.resolve(
            process.env.ASTRAL_ROOT,
            'shiva/scripts/aws-launch-configuration-user-data.sh'
          );
          fs.readFile(userDataPath, function (err, contents) {
            if (err) { return done(err); }
            userDataScript = contents.toString();
            done();
          });
        });

        beforeEach(function (done) {
          sinon.spy(Promise, 'resolve');
          done();
        });

        afterEach(function (done) {
          Promise.resolve.restore();
          done();
        });

        it('should fetch the base64 UserData script', function(done) {
          LaunchConfiguration._getUserDataScript()
            .then(function (base64) {
              expect(base64).to.equal(new Buffer(userDataScript).toString('base64'));
              expect(Promise.resolve.callCount).to.equal(0);
              done();
            })
            .catch(done);
        });

        it('should resolve with the cached script', function(done) {
          LaunchConfiguration._getUserDataScript()
            .then(function (base64) {
              expect(base64).to.equal(new Buffer(userDataScript).toString('base64'));
              expect(Promise.resolve.calledOnce).to.be.true();
              done();
            })
            .catch(done);
        });
      }); // end '_getUserDataScript'

      describe('create', function() {
        var userDataScript = 'fakeuserdata';

        beforeEach(function (done) {
          sinon.stub(LaunchConfiguration, '_getUserDataScript')
            .returns(Promise.resolve(userDataScript));
          done();
        });

        afterEach(function (done) {
          LaunchConfiguration._getUserDataScript.restore();
          done();
        });

        it('should throw with a non-string `name`', function(done) {
          var name = {};
          LaunchConfiguration.create(name).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/name.*must be a string/);
            expect(err.argumentName).to.equal('name');
            expect(err.argumentValue).to.equal(name);
            done();
          });
        });

        it('should throw when `name` is empty', function(done) {
          var name = '';
          LaunchConfiguration.create(name).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/name.*must not be empty/);
            expect(err.argumentName).to.equal('name');
            expect(err.argumentValue).to.equal(name);
            done();
          });
        });

        it('should throw when `options` is not an object', function(done) {
          var options = 'coolbeans';
          LaunchConfiguration.create('a', options).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/options.*must be an object/);
            expect(err.argumentName).to.equal('options');
            expect(err.argumentValue).to.equal(options);
            done();
          });
        });

        it('should fetch the user data script', function(done) {
          LaunchConfiguration.create('b')
            .then(function () {
              expect(LaunchConfiguration._getUserDataScript.calledOnce)
                .to.be.true();
              done();
            })
            .catch(done);
        });

        describe('AWS create', function() {
          it('should use the default configuration', function(done) {
            var name = 'some-name';
            var expectedOptions = defaults({
              LaunchConfigurationName: name,
              UserData: userDataScript
            }, LaunchConfigurationConfig.create);
            LaunchConfiguration.create(name)
              .then(function () {
                expect(
                  AutoScaling.createLaunchConfigurationAsync
                    .calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.createLaunchConfigurationAsync
                    .firstCall.args[0]
                ).to.deep.equal(expectedOptions);
                done();
              })
              .catch(done);
          });

          it('should use the given `LaunchConfigurationName`', function(done) {
            var name = 'expected-name';
            LaunchConfiguration.create(name)
              .then(function () {
                expect(
                  AutoScaling.createLaunchConfigurationAsync
                    .calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.createLaunchConfigurationAsync.firstCall
                    .args[0].LaunchConfigurationName
                  ).to.equal(name);
                done();
              })
              .catch(done);
          });

          it('should use the correct `UserData`', function(done) {
            LaunchConfiguration.create('helloooo')
              .then(function () {
                expect(
                  AutoScaling.createLaunchConfigurationAsync
                    .calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.createLaunchConfigurationAsync.firstCall
                    .args[0].UserData
                  ).to.equal(userDataScript);
                done();
              })
              .catch(done);
          });

          it('should use any overridden options', function(done) {
            var override = { UserData: 'wowiezowie' };
            LaunchConfiguration.create('helloooo', override)
              .then(function () {
                expect(
                  AutoScaling.createLaunchConfigurationAsync
                    .calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.createLaunchConfigurationAsync.firstCall
                    .args[0].UserData
                  ).to.equal(override.UserData);
                done();
              })
              .catch(done);
          });
        }); // end 'AWS create'

        it('should cast AWS errors', function(done) {
          var awsErr = new Error('ohnoes');
          AutoScaling.createLaunchConfigurationAsync
            .returns(Promise.reject(awsErr));
          LaunchConfiguration.create('wowienowizzz')
            .then(function () {
              done('Did not throw correctly');
            })
            .catch(function () {
              expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
              done();
            });
        });
      }); // end 'create'

      describe('remove', function() {
        it('should throw with non-string `name`', function(done) {
          var name = {};
          LaunchConfiguration.remove(name).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/name.*must be a string/);
            expect(err.argumentName).to.equal('name');
            expect(err.argumentValue).to.equal(name);
            done();
          });
        });

        it('should throw when `name` is empty', function(done) {
          var name = '';
          LaunchConfiguration.remove(name).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/name.*must not be empty/);
            expect(err.argumentName).to.equal('name');
            expect(err.argumentValue).to.equal(name);
            done();
          });
        });

        it('should use the correct options for the aws delete', function(done) {
          var name = 'somethingwowneatfuuuugggee';
          var expectedOptions = { LaunchConfigurationName: name };
          LaunchConfiguration.remove(name)
            .then(function () {
              expect(AutoScaling.deleteLaunchConfigurationAsync.calledOnce)
                .to.be.true();
              expect(
                AutoScaling.deleteLaunchConfigurationAsync.firstCall.args[0]
              ).to.deep.equal(expectedOptions);
              done();
            })
            .catch(done);
        });

        it('should cast AWS errors', function(done) {
          var awsErr = new Error('ohnoes');
          AutoScaling.deleteLaunchConfigurationAsync
            .returns(Promise.reject(awsErr));
          LaunchConfiguration.remove('asssssssskyourmom')
            .then(function () {
              done('Did not throw correctly');
            })
            .catch(function () {
              expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
              done();
            });
        });
      }); // end 'remove'

      describe('get', function() {
        it('should throw when `names` is not a string or an array', function(done) {
          var names = {};
          LaunchConfiguration.get(names).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/names.*must.*string.*array/);
            expect(err.argumentName).to.equal('names');
            expect(err.argumentValue).to.equal(names);
            done();
          });
        });

        it('should throw when `name` is empty', function(done) {
          var names = '';
          LaunchConfiguration.get(names).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/names.*must not be empty/);
            expect(err.argumentName).to.equal('names');
            expect(err.argumentValue).to.equal(names);
            done();
          });
        });

        it('should throw when `options` is not an object', function(done) {
          var options = 'coolbeans';
          LaunchConfiguration.get('a', options).asCallback(function (err) {
            expect(err).to.be.an.instanceof(InvalidArgumentError);
            expect(err.message).to.match(/options.*must be an object/);
            expect(err.argumentName).to.equal('options');
            expect(err.argumentValue).to.equal(options);
            done();
          });
        });

        describe('AWS describe', function() {
          it('should use the correct `LaunchConfigurationNames`', function(done) {
            var names = ['a', 'b', 'kappa'];
            var expectedOptions = { LaunchConfigurationNames: names };
            LaunchConfiguration.get(names)
              .then(function () {
                expect(
                  AutoScaling.describeLaunchConfigurationsAsync.calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.describeLaunchConfigurationsAsync.firstCall
                    .args[0]
                ).to.deep.equal(expectedOptions);
                done();
              })
              .catch(done);
          });

          it('should use the correct names when given a string `names` argument', function(done) {
            var name = 'woooooooowoooooowoooooo';
            var expectedOptions = { LaunchConfigurationNames: [ name ] };
            LaunchConfiguration.get(name)
              .then(function () {
                expect(
                  AutoScaling.describeLaunchConfigurationsAsync.calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.describeLaunchConfigurationsAsync.firstCall
                    .args[0]
                ).to.deep.equal(expectedOptions);
                done();
              })
              .catch(done);
          });

          it('should use any overridden options', function(done) {
            var overrides = { PityTheFool: 'i sure do' };
            LaunchConfiguration.get('what?', overrides)
              .then(function () {
                expect(
                  AutoScaling.describeLaunchConfigurationsAsync.calledOnce
                ).to.be.true();
                expect(
                  AutoScaling.describeLaunchConfigurationsAsync.firstCall
                    .args[0].PityTheFool
                ).to.deep.equal(overrides.PityTheFool);
                done();
              })
              .catch(done);
          });
        });

        it('should cast AWS errors', function(done) {
          var awsErr = new Error('ohnoes');
          AutoScaling.describeLaunchConfigurationsAsync
            .returns(Promise.reject(awsErr));
          LaunchConfiguration.get('asssssssskyourmom')
            .then(function () {
              done('Did not throw correctly');
            })
            .catch(function (err) {
              expect(Util.castAWSError.calledWith(awsErr)).to.be.true();
              done();
            });
        });
      }); // end 'get'

    }); // end 'LaunchConfiguration'
  }); // end 'models'
}); // end 'shiva'
