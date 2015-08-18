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
      sinon.stub(Cluster, 'exists').returns(Promise.resolve(false));
      sinon.stub(Cluster, 'insert').returns(Promise.resolve());
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      Cluster.exists.restore();
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

    it('should fatally reject if the job is missing an org_id', function(done) {
      clusterProvision({}).catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('cluster-provision');
        done();
      }).catch(done);
    });

    it('should check to see if the cluster exists', function(done) {
      var org_id = '1234';
      Cluster.exists.returns(Promise.resolve(true));
      clusterProvision({ org_id: org_id }).then(function () {
        expect(Cluster.exists.calledWith(org_id)).to.be.true();
        done();
      }).catch(done);
    });

    it('should stop if the cluster already exists', function(done) {
      Cluster.exists.returns(Promise.resolve(true));
      clusterProvision({ org_id: '22' }).then(function () {
        expect(Cluster.insert.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should insert the cluster into the database', function(done) {
      var org_id = '2345';
      clusterProvision({ org_id: org_id }).then(function () {
        expect(Cluster.insert.calledOnce).to.be.true();
        expect(Cluster.insert.firstCall.args[0]).to.deep.equal({
          id: org_id,
          security_group_id: process.env.AWS_CLUSTER_SECURITY_GROUP_ID,
          subnet_id: process.env.AWS_CLUSTER_SUBNET,
          ssh_key_name: process.env.AWS_SSH_KEY_NAME
        });
        done();
      }).catch(done);
    });

    it('should publish a message to create run instances', function(done) {
      var org_id = '5995992';
      clusterProvision({ org_id: org_id }).then(function (cluster) {
        expect(queue.publish.firstCall.args[0])
          .to.equal('cluster-instance-provision');
        expect(queue.publish.firstCall.args[1]).to.deep.equal({
          cluster_id: org_id,
          type: 'run'
        });
        done();
      }).catch(done);
    });

    it('should return the cluster on resolution', function(done) {
      var org_id = '482';
      clusterProvision({ org_id: org_id }).then(function (cluster) {
        expect(cluster).to.deep.equal({
          id: org_id,
          security_group_id: process.env.AWS_CLUSTER_SECURITY_GROUP_ID,
          subnet_id: process.env.AWS_CLUSTER_SUBNET,
          ssh_key_name: process.env.AWS_SSH_KEY_NAME
        });
        done();
      }).catch(done);
    });

    it('should reject on `Cluster.exists` errors', function(done) {
      var dbError = new Error('some friggen db error');
      var job = { org_id: '234ss5' };
      Cluster.exists.returns(Promise.reject(dbError));
      clusterProvision(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('cluster-provision');
        expect(err.data.job).to.equal(job);
        expect(err.data.originalError).to.equal(dbError);
        done();
      }).catch(done);
    });

    it('should reject on `Cluster.insert` errors', function(done) {
      var dbError = new Error('insert friggen failed');
      var job = { org_id: 'dooopppp' };
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
