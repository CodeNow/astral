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
var aws = require('providers/aws');
var queue = require('queue');
var checkInstancesReady = require('tasks/check-instances-ready');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');

describe('tasks', function() {
  describe('check-instances-ready', function() {
    var job = {
      cluster: { id: '123' },
      type: 'run',
      instances: [
        { InstanceId: '1234' }
      ]
    };

    beforeEach(function (done) {
      sinon.stub(aws, 'waitFor').returns(Promise.resolve({}));
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      done();
    });

    afterEach(function (done) {
      aws.waitFor.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      done();
    });

    it('should return a promise', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '1234' }
        ]
      };
      expect(checkInstancesReady(job).then).to.be.a.function();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      checkInstancesReady().asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject with a non-object `cluster`', function(done) {
      var job = { cluster: 42 };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject without `cluster.id`', function(done) {
      var job = { cluster: {} };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject with a non-string `type`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: { foo: 'bar' }
      };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject with a non-array `instances`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: 890123
      };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject if `instances` is malformed', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '1234' },
          'woot'
        ]
      };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject given an instance without an id', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '1234' },
          { foo: 'bar' }
        ]
      };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string id', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '1234' },
          { InstanceId: [1, 1, 2, 3, 5, 8, 13] }
        ]
      };
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('check-instances-ready');
        done();
      });
    });

    it('should resolve with correct parameters', function(done) {
      checkInstancesReady(job).asCallback(done);
    });

    it('should publish a `write-instances` job on resolution', function(done) {
      checkInstancesReady(job).then(function () {
        expect(queue.publish.calledWith('write-instances')).to.be.true();
        done();
      }).catch(done);
    });

    it('should provide a cluster to the `write-instances` job', function(done) {
      checkInstancesReady(job).then(function () {
        var data = queue.publish.firstCall.args[1];
        expect(data.cluster).to.deep.equal(job.cluster);
        done();
      }).catch(done);
    });

    it('should provide a type to the `write-instances` job', function(done) {
      checkInstancesReady(job).then(function () {
        var data = queue.publish.firstCall.args[1];
        expect(data.type).to.deep.equal(job.type);
        done();
      }).catch(done);
    });

    it('should provide the instances to the `write-instances` job', function(done) {
      checkInstancesReady(job).then(function () {
        var data = queue.publish.firstCall.args[1];
        expect(data.instances).to.deep.equal(job.instances);
        done();
      }).catch(done);
    });

    it('should correctly handle aws failures', function(done) {
      var awsError = new Error('AWS is being uncool right now, go away');
      aws.waitFor.returns(Promise.reject(awsError));
      checkInstancesReady(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.data.job).to.equal(job);
        expect(err.data.originalError).to.equal(awsError);
        done();
      });
    });
  }); // end 'check-instances-ready'
}); // end 'tasks'
