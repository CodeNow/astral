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

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var Instance = require('models/instance');
var clusterInstanceWrite = require('tasks/cluster-instance-write');

describe('tasks', function() {
  describe('cluster-instance-write', function() {
    var job = {
      cluster: { id: '123' },
      role: 'dock',
      instance: {
        InstanceId: '1234',
        ImageId: '123454',
        InstanceType: 't1.micro',
        PrivateIpAddress: '10.20.0.0'
      }
    };

    var instanceRow = {
      id: job.instance.InstanceId,
      cluster_id: job.cluster.id,
      role: job.role,
      aws_image_id: job.instance.ImageId,
      aws_instance_type: job.instance.InstanceType,
      aws_private_ip_address: job.instance.PrivateIpAddress
    };

    beforeEach(function (done) {
      sinon.stub(Instance, 'insert').returns(Promise.resolve());
      sinon.stub(Instance, 'exists').returns(Promise.resolve(false));
      done();
    });

    afterEach(function (done) {
      Instance.insert.restore();
      Instance.exists.restore();
      done();
    });

    it('should return a promise', function(done) {
      expect(clusterInstanceWrite(job).then).to.be.a.function();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterInstanceWrite().asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject with a non-object `cluster`', function(done) {
      var job = { cluster: 42 };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject without `cluster.id`', function(done) {
      var job = { cluster: {} };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject with a non-string `role`', function(done) {
      var job = {
        cluster: { id: '123' },
        role: { foo: 'bar' }
      };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject with a non-object `instance`', function(done) {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: 890123
      };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `InstanceId`', function(done) {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: { InstanceId: [1, 1, 2, 3, 5, 8, 13] }
      };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `ImageId`', function(done) {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: { InstanceId: '4582', ImageId: [1, 2, 4, 8] }
      };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `InstanceType`', function(done) {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: {
          InstanceId: '4582',
          ImageId: '728392',
          InstanceType: { foo: 'bar'}
        }
      };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `PrivateIpAddress`', function(done) {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: {
          InstanceId: '4582',
          ImageId: '728392',
          InstanceType: 'wow',
          PrivateIpAddress: [23, 42]
        }
      };
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-write');
        done();
      });
    });

    it('should resolve with correct parameters', function(done) {
      clusterInstanceWrite(job).asCallback(done);
    });

    it('should check to see if the instance exists', function(done) {
      clusterInstanceWrite(job).then(function () {
        expect(Instance.exists.calledOnce).to.be.true();
        expect(Instance.exists.firstCall.args[0]).to.deep.equal(instanceRow.id);
        done();
      }).catch(done);
    });

    it('should not attempt to insert rows if the instance exists', function(done) {
      Instance.exists.returns(Promise.resolve(true));
      clusterInstanceWrite(job).then(function () {
        expect(Instance.insert.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should insert the instances into the database', function(done) {
      clusterInstanceWrite(job).then(function () {
        expect(Instance.insert.calledOnce).to.be.true();
        expect(Instance.insert.firstCall.args[0]).to.deep.equal(instanceRow);
        done();
      }).catch(done);
    });

    it('should correctly handle database insert failures', function(done) {
      var dbError = new Error('Postgresql is being naughty');
      Instance.insert.returns(Promise.reject(dbError));
      clusterInstanceWrite(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.data.task).to.equal('cluster-instance-write');
        expect(err.data.originalError).to.equal(dbError);
        done();
      });
    });
  }); // end 'cluster-instance-write'
}); // end 'tasks'
