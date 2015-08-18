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
var createCluster = require('tasks/create-cluster');
var error = require('error');

describe('tasks', function() {
  describe('create-cluster', function() {
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
      createCluster().catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('create-cluster');
        done();
      });
    });

    it('should fatally reject if the job is missing an org_id', function(done) {
      createCluster({}).catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('create-cluster');
        done();
      });
    });

    it('should check to see if the cluster exists', function(done) {
      var org_id = '1234';
      Cluster.exists.returns(Promise.resolve(true));
      createCluster({ org_id: org_id }).then(function () {
        expect(Cluster.exists.calledWith(org_id)).to.be.true();
        done();
      });
    });

    it('should stop if the cluster already exists', function(done) {
      Cluster.exists.returns(Promise.resolve(true));
      createCluster({ org_id: '22' }).then(function () {
        expect(Cluster.insert.callCount).to.equal(0);
        done();
      });
    });

    it('should insert the cluster into the database', function(done) {
      var org_id = '2345';
      createCluster({ org_id: org_id }).then(function () {
        expect(Cluster.insert.calledOnce).to.be.true();
        expect(Cluster.insert.firstCall.args[0]).to.deep.equal({
          id: org_id,
          security_group_id: process.env.AWS_CLUSTER_SECURITY_GROUP_ID,
          subnet_id: process.env.AWS_CLUSTER_SUBNET,
          ssh_key_name: process.env.AWS_SSH_KEY_NAME
        });
        done();
      });
    });

    it('should publish a message to create run instances', function(done) {
      var org_id = '5995992';
      createCluster({ org_id: org_id }).then(function (cluster) {
        expect(queue.publish.firstCall.args[0]).to.equal('create-instances');
        expect(queue.publish.firstCall.args[1]).to.deep.equal({
          cluster: cluster,
          type: 'run'
        });
        done();
      });
    });

    it('should publish a message to check for cluster ready', function(done) {
      var org_id = '19293';
      createCluster({ org_id: org_id }).then(function () {
        expect(queue.publish.secondCall.args[0])
          .to.equal('check-cluster-ready');
        expect(queue.publish.secondCall.args[1]).to.deep.equal({
          cluster_id: org_id
        });
        done();
      });
    });

    it('should return the cluster on resolution', function(done) {
      var org_id = '482';
      createCluster({ org_id: org_id }).then(function (cluster) {
        expect(cluster).to.deep.equal({
          id: org_id,
          security_group_id: process.env.AWS_CLUSTER_SECURITY_GROUP_ID,
          subnet_id: process.env.AWS_CLUSTER_SUBNET,
          ssh_key_name: process.env.AWS_SSH_KEY_NAME
        });
        done();
      });
    });

    it('should reject on `Cluster.exists` errors', function(done) {
      var dbError = new Error('some friggen db error');
      var job = { org_id: '234ss5' };
      Cluster.exists.returns(Promise.reject(dbError));
      createCluster(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('create-cluster');
        expect(err.data.job).to.equal(job);
        expect(err.data.originalError).to.equal(dbError);
        done();
      });
    });

    it('should reject on `Cluster.insert` errors', function(done) {
      var dbError = new Error('insert friggen failed');
      var job = { org_id: 'dooopppp' };
      Cluster.insert.returns(Promise.reject(dbError));
      createCluster(job).catch(TaskError, function (err) {
        expect(err.data.task).to.equal('create-cluster');
        expect(err.data.job).to.equal(job);
        expect(err.data.originalError).to.equal(dbError);
        done();
      });
    });
  }); // end 'create-cluster'
}); // end 'tasks'
