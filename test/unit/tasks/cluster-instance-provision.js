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
    var instanceIds = [1];
    var instances = instanceIds.map(function (id) {
      return {
        InstanceId: id,
        State: {
          Name: 'pending'
        }
      };
    });
    var mockCluster = {
      id: 'some-id',
      githubId: 'some-github-id',
      deprovisioning: false
    };

    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(aws, 'createInstances').returns(Promise.resolve(instances));
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      sinon.stub(Cluster, 'getByGithubId')
        .returns(Promise.resolve(mockCluster));
      sinon.stub(Cluster, 'githubOrgExists').returns(Promise.resolve(true));
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      aws.createInstances.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      Cluster.getByGithubId.restore();
      Cluster.githubOrgExists.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterInstanceProvision().catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject without `githubId`', function(done) {
      var job = { role: 'dock' };
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject when given an invalid `role`', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'not-valid'
      };
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject if the cluster does not exist', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      Cluster.githubOrgExists.returns(Promise.resolve(false));
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should fatally reject if the cluster is deprovisioning', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      Cluster.getByGithubId.returns(Promise.resolve({
        id: 'some-id',
        githubId: 'some-github-id',
        deprovisioning: true
      }));
      clusterInstanceProvision(job).catch(TaskFatalError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should default `role` to "dock"', function(done) {
      var job = { githubId: 'some-id' };
      clusterInstanceProvision(job).then(function () {
        expect(job.role).to.equal('dock');
        done();
      }).catch(done);
    });

    it('should reject if AWS returns no instances', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      aws.createInstances.returns(Promise.resolve([]));
      clusterInstanceProvision(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });

    it('should publish `cluster-instance-wait` on success', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      clusterInstanceProvision(job).then(function () {
        expect(queue.publish.calledWith('cluster-instance-wait')).to.be.true();
        expect(queue.publish.firstCall.args[1]).to.deep.equal({
          cluster: mockCluster,
          role: job.role,
          instance: instances[0]
        });
        done();
      }).catch(done);
    });

    it('should publish `cluster-instance-tag` on success', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      clusterInstanceProvision(job).then(function () {
        expect(queue.publish.calledWith('cluster-instance-tag')).to.be.true();
        expect(queue.publish.secondCall.args[1]).to.deep.equal({
          org: job.githubId,
          role: job.role,
          instanceId: instanceIds[0]
        });
        done();
      }).catch(done);
    });

    it('should fatally reject if the instance is not pending', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      aws.createInstances.returns(Promise.resolve([{
        InstanceId: 'i-someinstance',
        State: {
          Name: 'terminated'
        }
      }]));
      clusterInstanceProvision(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('cluster-instance-provision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      }).catch(done);
    });
  }); // end 'cluster-instance-provision'
}); // end 'tasks'
