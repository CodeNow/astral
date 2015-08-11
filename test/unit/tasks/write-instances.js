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
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var Instance = require('models/instance');
var writeInstances = require('tasks/write-instances');

describe('tasks', function() {
  describe('write-instances', function() {
    var job = {
      cluster: { id: '123' },
      type: 'run',
      instances: [
        { InstanceId: '1234', ImageId: '123454', InstanceType: 't1.micro' },
        { InstanceId: '4582', ImageId: '728392', InstanceType: 't1.micro' }
      ]
    };

    var instanceRows = [
      {
        id: job.instances[0].InstanceId,
        cluster_id: job.cluster.id,
        type: job.type,
        ami_id: job.instances[0].ImageId,
        aws_type: job.instances[0].InstanceType
      },
      {
        id: job.instances[1].InstanceId,
        cluster_id: job.cluster.id,
        type: job.type,
        ami_id: job.instances[1].ImageId,
        aws_type: job.instances[1].InstanceType
      }
    ];

    beforeEach(function (done) {
      sinon.stub(Instance, 'insert').returns(Promise.resolve());
      done();
    });

    afterEach(function (done) {
      Instance.insert.restore();
      done();
    });

    it('should return a promise', function(done) {
      expect(writeInstances(job).then).to.be.a.function();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      writeInstances().asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject with a non-object `cluster`', function(done) {
      var job = { cluster: 42 };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject without `cluster.id`', function(done) {
      var job = { cluster: {} };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject with a non-string `type`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: { foo: 'bar' }
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject with a non-array `instances`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: 890123
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject if an instance is null or undefined', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '1234' },
          null
        ]
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject if an instance is a non-object', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          'woot'
        ]
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `InstanceId`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: [1, 1, 2, 3, 5, 8, 13] }
        ]
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `ImageId`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '4582', ImageId: [1, 2, 4, 8] }
        ]
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should fatally reject given an instance with a non-string `InstanceType`', function(done) {
      var job = {
        cluster: { id: '123' },
        type: 'run',
        instances: [
          { InstanceId: '4582', ImageId: '728392', InstanceType: { foo: 'bar'} }
        ]
      };
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('write-instances');
        done();
      });
    });

    it('should resolve with correct parameters', function(done) {
      writeInstances(job).asCallback(done);
    });

    it('should insert the instances into the database', function(done) {
      writeInstances(job).then(function () {
        expect(Instance.insert.calledOnce).to.be.true();
        expect(Instance.insert.firstCall.args[0]).to.deep.equal(instanceRows);
        done();
      }).catch(done);
    });

    it('should correctly handle database insert failures', function(done) {
      var dbError = new Error('Postgresql is being naughty');
      Instance.insert.returns(Promise.reject(dbError));
      writeInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.data.task).to.equal('write-instances');
        expect(err.data.originalError).to.equal(dbError);
        done();
      });
    });
  }); // end 'write-instances'
}); // end 'tasks'
