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
var createInstances = require('tasks/create-instances');

describe('tasks', function() {
  describe('create-instances', function() {
    var instanceIds = [1, 2, 3];
    var instances = instanceIds.map(function (id) {
      return { InstanceId: id };
    });

    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(aws, 'createInstances').returns(Promise.resolve(instances));
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      aws.createInstances.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      createInstances().catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without `cluster`', function(done) {
      createInstances({ type: 'run' }).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject if `cluster` is not an object', function(done) {
      var job = { cluster: 'invalid', type: 'run' };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without `cluster.id`', function(done) {
      var job = {
        cluster: {
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'run'
      };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without string `cluster.security_group_id`', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: {},
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'run'
      };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without string `cluster.subnet_id`', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: [23],
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'run'
      };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });


    it('should fatally reject without string `cluster.ssh_key_name`', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: { foo: 'bar' }
        },
        type: 'run'
      };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without a string `type`', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 123
      };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject when given an invalid `type`', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'not-valid'
      };
      createInstances(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('create-instances');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should accept `type` of "run"', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'run'
      };
      createInstances(job).asCallback(function (err) {
        expect(err).to.not.exist();
        done()
      });
    });

    it('should accept `type` of "build"', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'build'
      };
      createInstances(job).asCallback(function (err) {
        expect(err).to.not.exist();
        done()
      });
    });

    it('should publish `check-instances-ready` on success', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'build'
      };
      createInstances(job).then(function () {
        expect(queue.publish.calledWith('check-instances-ready')).to.be.true();
        expect(queue.publish.firstCall.args[1]).to.deep.equal({
          cluster: job.cluster,
          type: job.type,
          instances: instances
        });
        done();
      }).catch(done);
    });

    it('should publish `tag-instances` on success', function(done) {
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'run'
      };
      createInstances(job).then(function () {
        expect(queue.publish.calledWith('tag-instances')).to.be.true();
        expect(queue.publish.secondCall.args[1]).to.deep.equal({
          org: job.cluster.id,
          type: job.type,
          instanceIds: instanceIds
        });
        done();
      }).catch(done);
    });

    it('should correctly reject on aws errors', function(done) {
      var awsError = new Error('Some aws tom-foolery');
      aws.createInstances.returns(Promise.reject(awsError));
      var job = {
        cluster: {
          id: 'some-id',
          security_group_id: 'some-security-id',
          subnet_id: 'some-subnet-id',
          ssh_key_name: 'some-ssh-key-name'
        },
        type: 'build'
      };
      createInstances(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.data.task).to.equal('create-instances');
        expect(err.data.originalError).to.equal(awsError);
        done();
      });
    });
  }); // end 'create-instances'
}); // end 'tasks'
