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
var EC2 = astralRequire('shiva/models/aws/ec2');

describe('shiva', function () {
  describe('models', function () {
    describe('aws', function() {
      var sdk = EC2.getSDK();
      var sdkMethods = [
        'describeInstances',
        'terminateInstances',
        'runInstances',
        'waitFor'
      ];

      beforeEach(function (done) {
        sdkMethods.forEach(function (method) {
          sinon.stub(sdk, method).yieldsAsync()
        });
        done();
      });

      afterEach(function (done) {
        sdkMethods.forEach(function (method) { sdk[method].restore(); });
        done();
      });

      describe('EC2', function() {
        describe('_request', function() {
          it('should throw if the method does not exist', function(done) {
            EC2._request('not-a-thing').asCallback(function (err) {
              expect(err).to.be.an.instanceof(AWSMethodMissingError);
              done();
            });
          });

          it('should resolve on method success', function(done) {
            var response = { some: 'data' };
            var options = { neato: 'sweeto' };
            var method = 'describeInstances';
            sdk[method].yieldsAsync(null, response);
            EC2._request(method, options)
              .then(function (data) {
                expect(data).to.equal(response);
                done();
              })
              .catch(done);
          });

          it('should reject on method failure', function(done) {
            var awsError = new Error('AWS is so angry right now');
            var method = 'terminateInstances';
            sdk[method].yieldsAsync(awsError);
            EC2._request(method).asCallback(function (err) {
              expect(err).to.equal(awsError);
              done();
            });
          });
        }); // end '_request'

        describe('async method', function () {
          beforeEach(function (done) {
            sinon.stub(EC2, '_request');
            done();
          });

          afterEach(function (done) {
            EC2._request.restore();
            done();
          });

          describe('describeInstancesAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'describeInstances';
              EC2.describeInstancesAsync(options);
              expect(EC2._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'describeInstancesAsync'

          describe('terminateInstancesAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'terminateInstances';
              EC2.terminateInstancesAsync(options);
              expect(EC2._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'terminateInstancesAsync'

          describe('runInstancesAsync', function() {
            it('should call _request with the correct method', function(done) {
              var options = { some: 'options', wow: 'neat' };
              var method = 'runInstances';
              EC2.runInstancesAsync(options);
              expect(EC2._request.calledWith(method, options))
                .to.be.true();
              done();
            });
          }); // end 'runInstancesAsync'

          describe('waitForAsync', function() {
            it('should call waitFor with the correct args', function(done) {
              var condition = 'some-aws-condition';
              var options = { neat: 'cool' };
              EC2.waitForAsync(condition, options).asCallback(function (err) {
                expect(err).to.not.exist();
                expect(sdk.waitFor.calledOnce).to.be.true();
                expect(sdk.waitFor.firstCall.args[0]).to.equal(condition);
                expect(sdk.waitFor.firstCall.args[1]).to.deep.equal(options);
                done();
              });
            });

            it('should reject with any errors', function (done) {
              var error = new Error('omg cannot wait');
              sdk.waitFor.yieldsAsync(error);
              EC2.waitForAsync('yus', {}).asCallback(function (err) {
                expect(err).to.equal(error);
                done();
              });
            });
          }); // end 'waitForAsync'
        }); // end 'async method'
      }); // end 'AutoScaling'
    }); // end 'aws'
  }); // end 'models'
}); // end 'shiva'
