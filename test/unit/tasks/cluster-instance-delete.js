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

var knex = require('knex');
var Promise = require('bluebird');
var queue = require('queue');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');
var error = require('error');
var Instance = require('models/instance');

var clusterInstanceDelete = require('tasks/cluster-instance-delete');

describe('tasks', function() {
  describe('cluster-instance-delete', function() {

    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(Instance, 'softDelete').returns(Promise.resolve());
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      Instance.softDelete.restore();
      done();
    });

    it('should fatally reject without a job', function(done) {
      clusterInstanceDelete().asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject without `instanceId` of type {string}', function(done) {
      clusterInstanceDelete({}).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });

    });

    it('should fatally reject if `instanceId` is empty', function(done) {
      clusterInstanceDelete({ instanceId: '' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should mark the instance as deleted', function(done) {
      var job = { instanceId: 'i-woooo' };
      clusterInstanceDelete(job)
        .then(function () {
          expect(Instance.softDelete.calledOnce).to.be.true();
          expect(Instance.softDelete.firstCall.args[0]).to.equal(job.instanceId);
          done();
        })
        .catch(done);
    });
  }); // end 'cluster-instance-delete'
});
