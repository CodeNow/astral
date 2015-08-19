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
var Cluster = require('models/cluster');
var clusterInstanceProvision = require('tasks/cluster-instance-provision');

describe('tasks', function() {
  describe('cluster-instance-provision', function() {
    var instanceIds = [1, 2, 3];
    var instances = instanceIds.map(function (id) {
      return { InstanceId: id };
    });
    var mockCluster = {
      id: 'some-id',
      security_group_id: 'some-security-id',
      subnet_id: 'some-subnet-id',
      ssh_key_name: 'some-ssh-key-name'
    };

    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(aws, 'createInstances').returns(Promise.resolve(instances));
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      sinon.stub(Cluster, 'get').returns(Promise.resolve(mockCluster));
      sinon.stub(Cluster, 'exists').returns(Promise.resolve(true));
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      aws.createInstances.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      Cluster.get.restore();
      Cluster.exists.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterInstanceProvision().catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without `cluster_id`', function(done) {
      clusterInstanceProvision({ type: 'run' }).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without a string `type`', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 123
      };
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject when given an invalid `type`', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 'not-valid'
      };
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should accept `type` of "run"', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 'run'
      };
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.not.exist();
        done();
      });
    });

    it('should accept `type` of "build"', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 'build'
      };
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.not.exist();
        done()
      });
    });

    it('should fatally reject if the cluster does not exist', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 'build'
      };
      Cluster.exists.returns(Promise.resolve(false));
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);

      // clusterInstanceProvision(job).asCallback(function (err) {
      //   console.log(typeof err);
      //   expect(err).to.be.an.instanceof(TaskFatalError);
      //
      //   done();
      // });
    });

    it('should publish `cluster-instance-wait` on success', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 'build'
      };
      clusterInstanceProvision(job).then(function () {
        expect(queue.publish.calledWith('cluster-instance-wait')).to.be.true();
        expect(queue.publish.firstCall.args[1]).to.deep.equal({
          cluster: mockCluster,
          type: job.type,
          instances: instances
        });
        done();
      }).catch(done);
    });

    it('should publish `cluster-instance-tag` on success', function(done) {
      var job = {
        cluster_id: 'some-id',
        type: 'run'
      };
      clusterInstanceProvision(job).then(function () {
        expect(queue.publish.calledWith('cluster-instance-tag')).to.be.true();
        expect(queue.publish.secondCall.args[1]).to.deep.equal({
          org: mockCluster.id,
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
        cluster_id: 'some-id',
        type: 'build'
      };
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(err.data.originalError).to.equal(awsError);
        done();
      });
    });
  }); // end 'cluster-instance-provision'
}); // end 'tasks'
