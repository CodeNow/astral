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
var monitor = require('monitor-dog');

var aws = require(process.env.ASTRAL_ROOT + 'shiva/aws');
var clusterInstanceWait = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-instance-wait');
var server = require(process.env.ASTRAL_ROOT + 'shiva/server');

describe('shiva', function() {
  describe('tasks', function() {
    describe('cluster-instance-wait', function() {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: { InstanceId: '1234' }
      };

      beforeEach(function (done) {
        sinon.stub(aws, 'waitFor').returns(Promise.resolve({}));
        sinon.stub(server.hermes, 'publish');
        sinon.spy(monitor, 'increment');
        done();
      });

      afterEach(function (done) {
        aws.waitFor.restore();
        server.hermes.publish.restore();
        monitor.increment.restore();
        done();
      });

      it('should return a promise', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: { InstanceId: '1234' }
        };
        expect(clusterInstanceWait(job).then).to.be.a.function();
        done();
      });

      it('should fatally reject if not given a job', function(done) {
        clusterInstanceWait().asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject with a non-object `cluster`', function(done) {
        var job = { cluster: 42 };
        clusterInstanceWait(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/cluster.*object/);
          done();
        });
      });

      it('should fatally reject without `cluster.id`', function(done) {
        var job = { cluster: {} };
        clusterInstanceWait(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/cluster.id/);
          done();
        });
      });

      it('should fatally reject with a non-string `role`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: { foo: 'bar' }
        };
        clusterInstanceWait(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/role.*string/);
          done();
        });
      });

      it('should fatally reject with a non-object `instance`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: 890123
        };
        clusterInstanceWait(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/instance.*object/);
          done();
        });
      });

      it('should fatally reject with an invalid `instance`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: { foo: 'bar' }
        };
        clusterInstanceWait(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/InstanceId.*string/);
          done();
        });
      });

      it('should fatally reject if the instance cannot enter a running state', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: { InstanceId: '1234' }
        };

        var awsError = new Error('Resource is not in the state instanceRunning');
        awsError.code = 'ResourceNotReady';
        awsError.retryable = false;
        aws.waitFor.returns(Promise.reject(awsError));

        clusterInstanceWait(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/instance terminated.*running state/);
          done();
        });
      });

      it('should report aws limit errors to datadog', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: { InstanceId: '1234' }
        };

        var awsError = new Error('Resource is not in the state instanceRunning');
        awsError.code = 'ResourceNotReady';
        awsError.retryable = false;
        aws.waitFor.returns(Promise.reject(awsError));

        clusterInstanceWait(job).asCallback(function (err) {
          expect(monitor.increment.calledWith('aws.limit.exceeded'))
            .to.be.true();
          done();
        });
      });

      it('should resolve with correct parameters', function(done) {
        clusterInstanceWait(job).asCallback(done);
      });

      it('should publish a `cluster-instance-write` job on resolution', function(done) {
        clusterInstanceWait(job).then(function () {
          expect(server.hermes.publish.calledWith('cluster-instance-write')).to.be.true();
          done();
        }).catch(done);
      });

      it('should provide a cluster to the `cluster-instance-write` job', function(done) {
        clusterInstanceWait(job).then(function () {
          var data = server.hermes.publish.firstCall.args[1];
          expect(data.cluster).to.deep.equal(job.cluster);
          done();
        }).catch(done);
      });

      it('should provide a type to the `cluster-instance-write` job', function(done) {
        clusterInstanceWait(job).then(function () {
          var data = server.hermes.publish.firstCall.args[1];
          expect(data.role).to.exist();
          expect(data.role).to.deep.equal(job.role);
          done();
        }).catch(done);
      });

      it('should provide the instances to the `cluster-instance-write` job', function(done) {
        clusterInstanceWait(job).then(function () {
          var data = server.hermes.publish.firstCall.args[1];
          expect(data.instance).to.exist();
          expect(data.instance).to.deep.equal(job.instance);
          done();
        }).catch(done);
      });
    }); // end 'cluster-instance-wait'
  }); // end 'tasks'
}); // end 'shiva'
