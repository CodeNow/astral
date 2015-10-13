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
var Cluster = require('models/cluster');
var queue = require('queue');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var error = require('error');

var clusterDelete = require('tasks/cluster-delete');

describe('tasks', function() {
  describe('cluster-delete', function() {
    var mockCluster = {
      id: '12334',
      deprovisioning: true
    };

    var mockInstances = [
      { id: 'some-id', deleted: new Date() },
      { id: 'another-id', deleted: new Date() },
      { id: 'yus', deleted: new Date() }
    ];

    beforeEach(function (done) {
      sinon.stub(Cluster, 'get').returns(Promise.resolve(mockCluster));
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(Cluster, 'getInstances').returns(Promise.resolve(mockInstances));
      sinon.stub(Cluster, 'deleteInstances').returns(Promise.resolve());
      sinon.stub(Cluster, 'del').returns(Promise.resolve());
      done();
    });

    afterEach(function (done) {
      Cluster.get.restore();
      error.rejectAndReport.restore();
      Cluster.getInstances.restore();
      Cluster.deleteInstances.restore();
      Cluster.del.restore();
      done();
    })

    it('should fatally reject without a job', function(done) {
      clusterDelete().asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject without a `clusterId` of type {string}', function(done) {
      clusterDelete({ clusterId: [] }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fetch the cluster', function(done) {
      var job = { clusterId: '12334' };
      clusterDelete(job)
        .then(function () {
          expect(Cluster.get.calledWith(job.clusterId)).to.be.true();
          done();
        })
        .catch(done);
    });

    it('should fatally reject if the cluster does not exist', function(done) {
      Cluster.get.returns(Promise.resolve(null));
      clusterDelete({ clusterId: '12334' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject if the cluster is not deprovisioning', function(done) {
      Cluster.get.returns(Promise.resolve({
        id: '12334',
        deprovisioning: false
      }));
      clusterDelete({ clusterId: '12334' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should reject if there are still undeleted instances', function(done) {
      Cluster.getInstances.returns(Promise.resolve([
        { id: 'some-id', deleted: new Date() },
        { id: 'another-id', deleted: null },
        { id: 'wow', deleted: new Date() }
      ]));
      clusterDelete({ clusterId: '12334' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.data.task).to.equal('cluster-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should hard delete the instances for the cluster', function(done) {
      var job = { clusterId: '12334' };
      clusterDelete(job)
        .then(function () {
          expect(Cluster.deleteInstances.calledWith(job.clusterId))
            .to.be.true();
          done();
        })
        .catch(done);
    });

    it('should hard delete the cluster', function(done) {
      var job = { clusterId: '12334' };
      clusterDelete(job)
        .then(function () {
          expect(Cluster.del.calledWith(job.clusterId)).to.be.true();
          done();
        })
        .catch(done);
    });
  }); // end 'cluster-delete'
}); // end 'tasks'
