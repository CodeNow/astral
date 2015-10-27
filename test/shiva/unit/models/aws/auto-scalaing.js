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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var AutoScaling = require(process.env.ASTRAL_ROOT + 'shiva/models/aws/auto-scaling');

describe('shiva', function () {
  describe('models', function () {
    describe('aws', function() {
      var sdk = AutoScaling.getSDK();

      beforeEach(function (done) {
        sinon.stub(sdk, 'createLaunchConfiguration');
        sinon.stub(sdk, 'describeLaunchConfigurations');
        sinon.stub(sdk, 'deleteLaunchConfiguration');
        done();
      });

      afterEach(function (done) {
        sdk.createLaunchConfiguration.restore();
        sdk.describeLaunchConfigurations.restore();
        sdk.deleteLaunchConfiguration.restore();
        done();
      });

      describe('AutoScaling', function() {
        describe('createLaunchConfigurationAsync', function() {
          it('should resolve on success', function(done) {
            var response = 'wowie';
            sdk.createLaunchConfiguration.yieldsAsync(null, response);
            AutoScaling.createLaunchConfigurationAsync({})
              .then(function (data) {
                expect(data).to.equal(response);
                done();
              })
              .catch(done);
          });

          it('should reject on error', function(done) {
            var awsError = new Error('Oh DAMN');
            sdk.createLaunchConfiguration.yieldsAsync(awsError);
            AutoScaling.createLaunchConfigurationAsync({})
              .asCallback(function (err) {
                expect(err).to.equal(awsError);
                done();
              });
          });
        }); // end 'createLaunchConfigurationAsync'

        describe('describeLaunchConfigurationsAsync', function() {
          it('should resolve on success', function(done) {
            var response = 'wowie';
            sdk.describeLaunchConfigurations.yieldsAsync(null, response);
            AutoScaling.describeLaunchConfigurationsAsync({})
              .then(function (data) {
                expect(data).to.equal(response);
                done();
              })
              .catch(done);
          });

          it('should reject on error', function(done) {
            var awsError = new Error('Oh DAMN');
            sdk.describeLaunchConfigurations.yieldsAsync(awsError);
            AutoScaling.describeLaunchConfigurationsAsync({})
              .asCallback(function (err) {
                expect(err).to.equal(awsError);
                done();
              });
          });
        }); // end 'describeLaunchConfigurationsAsync'

        describe('deleteLaunchConfigurationAsync', function() {
          it('should resolve on success', function(done) {
            var response = 'wowie';
            sdk.deleteLaunchConfiguration.yieldsAsync(null, response);
            AutoScaling.deleteLaunchConfigurationAsync({})
              .then(function (data) {
                expect(data).to.equal(response);
                done();
              })
              .catch(done);
          });

          it('should reject on error', function(done) {
            var awsError = new Error('Oh DAMN');
            sdk.deleteLaunchConfiguration.yieldsAsync(awsError);
            AutoScaling.deleteLaunchConfigurationAsync({})
              .asCallback(function (err) {
                expect(err).to.equal(awsError);
                done();
              });
          });
        }); // end 'deleteLaunchConfigurationAsync'
      }); // end 'AutoScaling'
    }); // end 'aws'
  }); // end 'models'
}); // end 'shiva'
