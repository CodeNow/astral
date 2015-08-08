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
var hermes = require('queue');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var checkClusterReady = require('tasks/check-cluster-ready');
var error = require('error');

describe('tasks', function() {
  describe('check-cluster-ready', function() {
    var clock;

    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.spy(error, 'report');
      sinon.spy(error, 'log');
      sinon.stub(Cluster, 'countInstances').returns(Promise.resolve(1));
      sinon.stub(hermes, 'publish');
      clock = sinon.useFakeTimers();
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      error.log.restore();
      error.report.restore();
      Cluster.countInstances.restore();
      hermes.publish.restore();
      clock.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      checkClusterReady().catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('check-cluster-ready');
        done();
      }).catch(done);
    });

    it('should fatally reject if not given a `cluster_id`', function(done) {
      checkClusterReady({}).catch(TaskFatalError, function (err) {
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        expect(err.data.task).to.equal('check-cluster-ready');
        done();
      }).catch(done);
    });

    it('should publish a `cluster-ready` event', function(done) {
      var cluster_id = '12345';
      checkClusterReady({ cluster_id: cluster_id }).then(function () {
        expect(hermes.publish.calledWith('cluster-ready')).to.be.true();
        expect(hermes.publish.firstCall.args[1]).to.deep.equal({
          org_id: cluster_id
        });
        done();
      }).catch(done);
      clock.tick(process.env.CLUSTER_READY_INTERVAL);
    });

    it('should keep trying until the cluster is ready', function(done) {
      var cluster_id = '8128skns';
      Cluster.countInstances.returns(Promise.resolve(0));
      checkClusterReady({ cluster_id: cluster_id }).then(function () {
        expect(hermes.publish.calledWith('cluster-ready')).to.be.true();
        expect(hermes.publish.firstCall.args[1]).to.deep.equal({
          org_id: cluster_id
        });
        done();
      }).catch(done);
      clock.tick(process.env.CLUSTER_READY_INTERVAL);
      Cluster.countInstances.returns(Promise.resolve(1));
      clock.tick(process.env.CLUSTER_READY_INTERVAL);
    });

    it('should gracefully reject on a query failure', function(done) {
      var dbError = new Error('Yo, db be broken yo.');
      var job = { cluster_id: 'jsjnskn233' };
      Cluster.countInstances.returns(Promise.reject(dbError));
      checkClusterReady(job).catch(TaskError, function (err) {
        expect(error.report.calledWith(err)).to.be.true();
        expect(error.log.calledWith(err)).to.be.true();
        expect(err.data.originalError).to.equal(dbError);
        expect(err.data.job).to.equal(job);
        done();
      }).catch(done);
      clock.tick(process.env.CLUSTER_READY_INTERVAL);
    });
  }); // end 'check-cluster-ready'
}); // end 'tasks'
