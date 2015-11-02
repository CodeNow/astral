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

var AWSMethodMissingError = astralRequire('shiva/errors/aws-method-missing-error');
var AutoScaling = astralRequire('shiva/models/aws/auto-scaling');

describe('shiva', function () {
  describe('models', function () {
    describe('aws', function() {
      var sdk = AutoScaling.getSDK();
      var sdkMethods = [
        'createLaunchConfiguration',
        'describeLaunchConfigurations',
        'deleteLaunchConfiguration',
        'createAutoScalingGroup',
        'deleteAutoScalingGroup',
        'describeAutoScalingGroups',
        'updateAutoScalingGroup'
      ];

      beforeEach(function (done) {
        sdkMethods.forEach(function (method) { sinon.stub(sdk, method) });
        done();
      });

      afterEach(function (done) {
        sdkMethods.forEach(function (method) { sdk[method].restore(); });
        done();
      });

      describe('AutoScaling', function() {
        describe('_request', function() {
          it('should throw if the method does not exist', function(done) {
            AutoScaling._request('not-a-thing').asCallback(function (err) {
              expect(err).to.be.an.instanceof(AWSMethodMissingError);
              done();
            });
          });

          it('should resolve on method success', function(done) {
            var response = { some: 'data' };
            var options = { neato: 'sweeto' };
            var method = 'createLaunchConfiguration';
            sdk[method].yieldsAsync(null, response);
            AutoScaling._request(method, options)
              .then(function (data) {
                expect(data).to.equal(response);
                done();
              })
              .catch(done);
          });

          it('should reject on method failure', function(done) {
            var awsError = new Error('AWS is so angry right now');
            var method = 'createLaunchConfiguration';
            sdk[method].yieldsAsync(awsError);
            AutoScaling._request(method).asCallback(function (err) {
              expect(err).to.equal(awsError);
              done();
            });
          });
        });

        describe('async method', function() {
          beforeEach(function (done) {
            sinon.stub(AutoScaling, '_request');
            done();
          });

          afterEach(function (done) {
            AutoScaling._request.restore();
            done();
          });

          describe('createAutoScalingGroupAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'createAutoScalingGroup';
              AutoScaling.createAutoScalingGroupAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'createAutoScalingGroupAsync'

          describe('deleteAutoScalingGroupAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'deleteAutoScalingGroup';
              AutoScaling.deleteAutoScalingGroupAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'deleteAutoScalingGroupAsync'

          describe('describeAutoScalingGroupsAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'describeAutoScalingGroups';
              AutoScaling.describeAutoScalingGroupsAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'describeAutoScalingGroupsAsync'

          describe('updateAutoScalingGroupAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'updateAutoScalingGroup';
              AutoScaling.updateAutoScalingGroupAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'updateAutoScalingGroupAsync'

          describe('createLaunchConfigurationAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'createLaunchConfiguration';
              AutoScaling.createLaunchConfigurationAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'createLaunchConfigurationAsync'

          describe('describeLaunchConfigurationsAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'describeLaunchConfigurations';
              AutoScaling.describeLaunchConfigurationsAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'describeLaunchConfigurationsAsync'

          describe('deleteLaunchConfigurationAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'deleteLaunchConfiguration';
              AutoScaling.deleteLaunchConfigurationAsync(options);
              expect(AutoScaling._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'deleteLaunchConfigurationAsync'
        });
      }); // end 'AutoScaling'
    }); // end 'aws'
  }); // end 'models'
}); // end 'shiva'
