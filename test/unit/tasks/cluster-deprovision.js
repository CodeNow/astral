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
var error = require('error');

var clusterDeprovision = require('tasks/cluster-deprovision');

describe('tasks', function() {
  describe('cluster-deprovision', function() {
    var mockCluster = { id: '12324-fsx-2244' };
    var mockInstances = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' }
    ];

    beforeEach(function (done) {
      sinon.stub(queue, 'publish');
      sinon.stub(Cluster, 'getByGithubId')
        .returns(Promise.resolve(mockCluster));
      sinon.stub(Cluster, 'getInstances')
        .returns(Promise.resolve(mockInstances));
      sinon.spy(error, 'rejectAndReport');
      done();
    });

    afterEach(function (done) {
      queue.publish.restore();
      Cluster.getByGithubId.restore();
      Cluster.getInstances.restore();
      error.rejectAndReport.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterDeprovision().asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-deprovision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject without a scalar `githubId`', function(done) {
      clusterDeprovision({ githubId: [12] }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-deprovision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should resolve with a numeric `githubId`', function(done) {
      var job = { githubId: 12324 };
      clusterDeprovision(job).asCallback(done);
    });

    it('should resolve with a string `githubId`', function(done) {
      var job = { githubId: '12324' };
      clusterDeprovision(job).asCallback(done);
    });

    it('should lookup the cluster by githubId', function(done) {
      var job = { githubId: '12324' };
      clusterDeprovision(job)
        .then(function () {
          expect(Cluster.getByGithubId.calledOnce).to.be.true();
          expect(Cluster.getByGithubId.calledWith(job.githubId)).to.be.true();
          done();
        })
        .catch(done);
    });

    it('should fatally reject if no cluster exists', function(done) {
      Cluster.getByGithubId.returns(Promise.resolve(null));
      clusterDeprovision({ githubId: '12' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-deprovision');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should find all instances for the cluster', function(done) {
      var job = { githubId: '12324' };
      clusterDeprovision(job)
        .then(function () {
          expect(Cluster.getInstances.calledOnce).to.be.true();
          expect(Cluster.getInstances.calledWith(mockCluster.id)).to.be.true();
          done();
        })
        .catch(done);
    });

    it('should publish `cluster-instance-terminate` for each cluster instance', function(done) {
      var job = { githubId: '12324' };
      clusterDeprovision(job)
        .then(function () {
          for (var i = 0; i < 3; i++) {
            expect(queue.publish.getCall(i).args[0])
              .to.equal('cluster-instance-terminate');
            expect(queue.publish.getCall(i).args[1])
              .to.deep.equal({ instanceId: mockInstances[i].id })
          }
          done();
        })
        .catch(done);
    });

    it('should publish `cluster-delete`', function(done) {
      var job = { githubId: '12324' };
      clusterDeprovision(job)
        .then(function () {
          expect(queue.publish.lastCall.args[0])
            .to.equal('cluster-delete');
          expect(queue.publish.lastCall.args[1])
            .to.deep.equal({ clusterId: mockCluster.id });
          done();
        })
        .catch(done);
    });
  }); // end 'cluster-deprovision'
}); // end 'tasks'
