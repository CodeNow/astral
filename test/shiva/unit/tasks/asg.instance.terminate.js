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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;

var aws = require(process.env.ASTRAL_ROOT + 'shiva/aws');
var asgInstanceTerminate = require(
  process.env.ASTRAL_ROOT +
  'shiva/tasks/asg.instance.terminate'
);

describe('shiva', function() {
  describe('tasks', function() {
    describe('asg.instance.terminate', function() {
      var ipInstanceId = 'instance-id-for-ip';

      beforeEach(function (done) {
        sinon.stub(aws, 'describeInstances').returns(Promise.resolve({
          Reservations: [
            {
              Instances: [
                { InstanceId: ipInstanceId }
              ]
            }
          ]
        }));
        sinon.stub(aws, 'terminateInstances').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        aws.terminateInstances.restore();
        aws.describeInstances.restore();
        done();
      });

      it('should fatally reject if not given a job', function(done) {
        asgInstanceTerminate().asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject without `instanceId` or `ipAddress`', function (done) {
        var job = {};
        asgInstanceTerminate(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/instanceId.*or.*ipAddress.*string/);
          done();
        });
      });

      describe('with `instanceId`', function () {
        it('should fatally reject with empty `instanceId`', function (done) {
          var job = { instanceId: '' };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.be.an.instanceof(TaskFatalError);
            expect(err.message).to.match(/instanceId.*and.*ipAddress.*empty/);
            done();
          });
        });

        it('should not call `describeInstances`', function (done) {
          var job = { instanceId: 'some-id' };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.not.exist();
            expect(aws.describeInstances.callCount).to.equal(0);
            done();
          });
        });

        it('should terminate the given `instanceId`', function (done) {
          var instanceId = 'neato-elito';
          var job = { instanceId: instanceId };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.not.exist();
            expect(aws.terminateInstances.firstCall.args[0]).to.deep.equal({
              InstanceIds: [ instanceId ]
            });
            done();
          });
        });
      });

      describe('with `ipAddress`', function () {
        it('should fatally reject with empty `ipAddress`', function (done) {
          var job = { ipAddress: '' };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.be.an.instanceof(TaskFatalError);
            expect(err.message).to.match(/instanceId.*and.*ipAddress.*empty/);
            done();
          });
        });

        it('should find the instance id via `describeInstances`', function (done) {
          var ipAddress = '0.0.0.1';
          var job = { ipAddress: ipAddress };
          var expectedQuery = {
            Filters: [{ Name: 'private-ip-address', Values: [ ipAddress ] }]
          };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.not.exist();
            expect(aws.describeInstances.calledOnce).to.be.true();
            expect(aws.describeInstances.firstCall.args[0])
              .to.deep.equal(expectedQuery);
            done();
          });
        });

        it('should fatally reject if no instance has the given `ipAddress`', function (done) {
          aws.describeInstances.returns(Promise.resolve({ Reservations: [] }));
          var job = { ipAddress: '1.2.3.4' };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.be.an.instanceof(TaskFatalError);
            expect(err.message).to.match(/not.*ip address/);
            done();
          });
        });

        it('should terminate the instance with the given `ipAddress`', function (done) {
          var job = { ipAddress: '0.1.0.1' };
          asgInstanceTerminate(job).asCallback(function (err) {
            expect(err).to.not.exist();
            expect(aws.terminateInstances.calledOnce).to.be.true();
            expect(aws.terminateInstances.firstCall.args[0]).to.deep.equal({
              InstanceIds: [ipInstanceId]
            });
            done();
          });
        });
      });

      it('should fatally error if the instance does not exist', function (done) {
        var awsError = new Error('No instance found');
        awsError.code = 'InvalidInstanceID.NotFound';
        aws.terminateInstances.returns(Promise.reject(awsError));
        var job = { instanceId: '2345' };
        asgInstanceTerminate(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/Instance.*does not exist/);
          done();
        });
      });

      it('should re-throw unknown errors', function (done) {
        var randomError = new Error('What? I mean keewl!');
        aws.terminateInstances.returns(Promise.reject(randomError));
        var job = { instanceId: '123444' };
        asgInstanceTerminate(job).asCallback(function (err) {
          expect(err).to.equal(randomError);
          done();
        });
      });
    }); // end 'cluster-instance-terminate'
  }); // end 'tasks'
}); // end 'shiva'
