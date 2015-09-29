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

require('loadenv')('shiva:test');

var Promise = require('bluebird');
var queue = require('queue');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var error = require('error');
var aws = require('providers/aws');
var Instance = require('models/instance');
var clusterInstanceTerminate = require('tasks/cluster-instance-terminate');

describe('tasks', function() {
  describe('cluster-instance-terminate', function() {
    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(aws, 'terminateInstances').returns(Promise.resolve());
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      sinon.stub(Instance, 'get').returns(Promise.resolve({ instanceId: 'some-id' }));
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      aws.terminateInstances.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      Instance.get.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterInstanceTerminate().asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-terminate');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject without `id` of type {string}', function(done) {
      var job = { instanceId: [1, 2, 3, 4] };
      clusterInstanceTerminate(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-terminate');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject if `id` is empty', function(done) {
      var job = { instanceId: '' };
      clusterInstanceTerminate(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-terminate');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject if no instance with `id` exists', function(done) {
      Instance.get.returns(Promise.resolve(null));
      clusterInstanceTerminate({ instanceId: '123' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-terminate');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should handle errors when checking for the instance', function(done) {
      var instanceError = new Error('I have misplaced the database...');
      Instance.get.returns(Promise.reject(instanceError));
      clusterInstanceTerminate({ instanceId: '234' }).asCallback(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('should call aws `terminateInstances` with correct id', function(done) {
      var id = 'i-12345';
      var job = { instanceId: id };
      clusterInstanceTerminate(job).then(function () {
        expect(aws.terminateInstances.calledOnce).to.be.true();
        expect(aws.terminateInstances.firstCall.args[0]).to.deep.equal({
          InstanceIds: [ id ]
        });
        done();
      }).catch(done);
    });

    it('should enqueue a `cluster-instance-delete` job', function(done) {
      var id = 'i-abc';
      var job = { instanceId: id };
      clusterInstanceTerminate(job).then(function () {
        expect(queue.publish.calledOnce).to.be.true();
        expect(queue.publish.firstCall.args[0])
          .to.equal('cluster-instance-delete');
        expect(queue.publish.firstCall.args[1]).to.deep.equal({ instanceId: id });
        done();
      }).catch(done);
    });

    it('should correctly catch AWS errors', function(done) {
      var awsError = new Error('instances be bad yo');
      aws.terminateInstances.returns(Promise.reject(awsError));
      clusterInstanceTerminate({ instanceId: 'a' })
        .then(function () { done('Did not reject with error')})
        .catch(TaskError, function (err) {
          expect(err).to.be.an.instanceof(TaskError);
          expect(err.data.task).to.equal('cluster-instance-terminate');
          expect(err.data.originalError).to.equal(awsError);
          done();
        })
        .catch(done);
    });

    it('should correctly handle instance not found aws errors', function(done) {
      var awsError = new Error('Instance not found');
      awsError.code = 'InvalidInstanceID.NotFound';
      aws.terminateInstances.returns(Promise.reject(awsError));
      var job = { instanceId: 'instance-id' };
      clusterInstanceTerminate(job)
        .then(function () {
          expect(queue.publish.calledOnce).to.be.true();
          expect(queue.publish.firstCall.args[0])
            .to.equal('cluster-instance-delete');
          expect(queue.publish.firstCall.args[1]).to.deep.equal({
            instanceId: job.instanceId
          });
          done();
        })
        .catch(done);
    });

    it('should catch all other errors', function(done) {
      var queueError = new Error('just exploding cause whateves');
      queue.publish.throws(queueError);
      clusterInstanceTerminate({ instanceId: 'b' })
        .then(function () { done('Did not reject with error')})
        .catch(TaskError, function (err) {
          expect(err).to.be.an.instanceof(TaskError);
          expect(err.data.task).to.equal('cluster-instance-terminate');
          expect(err.data.originalError).to.equal(queueError);
          done();
        })
        .catch(done);
    });
  }); // end 'cluster-instance-terminate'
}); // end 'tasks'
