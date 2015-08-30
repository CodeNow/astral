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
var Cluster = require('models/cluster');
var queue = require('queue');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var clusterProvision = require('tasks/cluster-provision');
var error = require('error');

describe('tasks', function() {
  describe('cluster-provision', function() {
    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(Cluster, 'githubOrgExists').returns(Promise.resolve(false));
      sinon.stub(Cluster, 'insert').returns(Promise.resolve());
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      Cluster.githubOrgExists.restore();
      Cluster.insert.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterProvision().catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('cluster-provision');
        done();
      }).catch(done);
    });

    it('should fatally reject without job `githubId`', function(done) {
      clusterProvision({ bitbucket_id: 'no' }).catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('cluster-provision');
        done();
      }).catch(done);
    });

    it('should check to see if a cluster already exists', function(done) {
      var githubId = '1234';
      Cluster.githubOrgExists.returns(Promise.resolve(true));
      clusterProvision({ githubId: githubId }).then(function () {
        expect(Cluster.githubOrgExists.calledWith(githubId)).to.be.true();
        done();
      }).catch(done);
    });

    it('should stop if the cluster already exists', function(done) {
      Cluster.githubOrgExists.returns(Promise.resolve(true));
      clusterProvision({ githubId: '22' }).then(function () {
        expect(Cluster.insert.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should insert the cluster into the database', function(done) {
      var githubId = '2345';
      clusterProvision({ githubId: githubId }).then(function () {
        expect(Cluster.insert.calledOnce).to.be.true();
        expect(Cluster.insert.firstCall.args[0]).to.deep.equal({
          'github_id': githubId
        });
        done();
      }).catch(done);
    });

    it('should publish messages to provision dock instances', function(done) {
      var githubId = '5995992';
      clusterProvision({ githubId: githubId }).then(function (cluster) {
        expect(queue.publish.callCount)
          .to.equal(process.env.CLUSTER_INITIAL_DOCKS);
        for (var i = 0; i < process.env.CLUSTER_INITIAL_DOCKS; i++) {
          expect(queue.publish.getCall(i).args[0])
            .to.equal('cluster-instance-provision');
          expect(queue.publish.getCall(i).args[1]).to.deep.equal({
            githubId: githubId
          });
        }
        done();
      }).catch(done);
    });

    it('should reject on `Cluster.githubOrgExists` errors', function(done) {
      var dbError = new Error('some friggen db error');
      var job = { githubId: '234ss5' };
      Cluster.githubOrgExists.returns(Promise.reject(dbError));
      clusterProvision(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('cluster-provision');
        expect(err.data.job).to.equal(job);
        expect(err.data.originalError).to.equal(dbError);
        done();
      }).catch(done);
    });

    it('should reject on `Cluster.insert` errors', function(done) {
      var dbError = new Error('insert friggen failed');
      var job = { githubId: 'dooopppp' };
      Cluster.insert.returns(Promise.reject(dbError));
      clusterProvision(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('cluster-provision');
        expect(err.data.job).to.equal(job);
        expect(err.data.originalError).to.equal(dbError);
        done();
      }).catch(done);
    });
  }); // end 'cluster-provision'
}); // end 'tasks'
