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

var ec2 = require(process.env.ASTRAL_ROOT + 'shiva/models/aws/ec2');
var asgInstanceTerminate = require(
  process.env.ASTRAL_ROOT +
  'shiva/tasks/asg.instance.terminate'
);

describe('shiva', function() {
  describe('tasks', function() {
    describe('asg.instance.terminate', function() {
      var ipInstanceId = 'instance-id-for-ip';

      beforeEach(function (done) {
        sinon.stub(ec2, 'describeInstancesAsync').returns(Promise.resolve({
          Reservations: [
            {
              Instances: [
                { InstanceId: ipInstanceId }
              ]
            }
          ]
        }));
        sinon.stub(ec2, 'terminateInstancesAsync').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        ec2.terminateInstancesAsync.restore();
        ec2.describeInstancesAsync.restore();
        done();
      });

      it('should fatally reject if not given a job', function(done) {
        asgInstanceTerminate().asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject without `ipAddress`', function (done) {
        var job = {};
        asgInstanceTerminate(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/valid.*ipAddress.*string/);
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
          expect(ec2.describeInstancesAsync.calledOnce).to.be.true();
          expect(ec2.describeInstancesAsync.firstCall.args[0])
            .to.deep.equal(expectedQuery);
          done();
        });
      });

      it('should fatally reject if no instance has the given `ipAddress`', function (done) {
        ec2.describeInstancesAsync.returns(Promise.resolve({ Reservations: [] }));
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
          expect(ec2.terminateInstancesAsync.calledOnce).to.be.true();
          expect(ec2.terminateInstancesAsync.firstCall.args[0]).to.deep.equal({
            InstanceIds: [ipInstanceId]
          });
          done();
        });
      });

      it('should fatally error if the instance does not exist', function (done) {
        var awsError = new Error('No instance found');
        awsError.code = 'InvalidInstanceID.NotFound';
        ec2.terminateInstancesAsync.returns(Promise.reject(awsError));
        var job = { ipAddress: '127.0.0.1' };
        asgInstanceTerminate(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/Instance.*no longer exists/);
          done();
        });
      });

      it('should re-throw unknown errors', function (done) {
        var randomError = new Error('What? I mean keewl!');
        ec2.terminateInstancesAsync.returns(Promise.reject(randomError));
        var job = { ipAddress: '127.0.0.1' };
        asgInstanceTerminate(job).asCallback(function (err) {
          expect(err).to.equal(randomError);
          done();
        });
      });
    }); // end 'cluster-instance-terminate'
  }); // end 'tasks'
}); // end 'shiva'
