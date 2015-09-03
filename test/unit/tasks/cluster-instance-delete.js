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
    var selectMock = {
      where: function () {}
    };

    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(Instance, 'update').returns(Promise.resolve());
      sinon.stub(Instance, 'select').returns(selectMock);
      sinon.stub(selectMock, 'where').returns(Promise.resolve([
        { deleted: null }
      ]));
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      Instance.update.restore();
      Instance.select.restore();
      selectMock.where.restore();
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

    it('should fatally reject without `id` of type {string}', function(done) {
      clusterInstanceDelete({}).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });

    });

    it('should fatally reject if `id` is empty', function(done) {
      clusterInstanceDelete({ id: '' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-delete');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should check if the instance has already been deleted', function(done) {
      var job = { id: 'i-hiya' };
      clusterInstanceDelete(job).then(function () {
        expect(Instance.select.calledOnce).to.be.true();
        expect(selectMock.where.calledOnce).to.be.true();
        expect(selectMock.where.firstCall.args[0]).to.deep.equal({
          id: job.id
        });
        done();
      }).catch(done);
    });

    it('should not proceed if the instance is already deleted', function(done) {
      var job = { id: 'i-yay' };
      selectMock.where.returns(Promise.resolve([ { deleted: new Date() } ]));
      clusterInstanceDelete(job).then(function () {
        expect(Instance.update.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should not proceed if no instance with the given id exists', function(done) {
      var job = { id: 'i-neatsuchwow' };
      selectMock.where.returns(Promise.resolve([]));
      clusterInstanceDelete(job).then(function () {
        expect(Instance.update.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should handle instance deleted check errors', function(done) {
      var countError = new Error('Psql forgot how to count');
      selectMock.where.returns(Promise.reject(countError));
      clusterInstanceDelete({ id: '1' })
        .then(function () { done('Did not reject correctly.')})
        .catch(TaskError, function (err) {
          expect(err.data.task).to.equal('cluster-instance-delete');
          expect(error.rejectAndReport.calledWith(err)).to.be.true();
          expect(err.data.originalError).to.equal(countError);
          done();
        })
        .catch(done);
    });

    it('should mark the instance as deleted', function(done) {
      var job = { id: 'i-woooo' };
      clusterInstanceDelete(job)
        .then(function () {
          expect(Instance.update.calledOnce).to.be.true();
          expect(Instance.update.firstCall.args[0]).to.equal(job.id);
          expect(Instance.update.firstCall.args[1]).to.deep.equal({
            deleted: knex.raw('now()')
          });
          done();
        })
        .catch(done);
    });

    it('should handle errors when marking the instance', function(done) {
      var updateError = new Error('Update failed, taking a nap');
      Instance.update.returns(Promise.reject(updateError));
      clusterInstanceDelete({ id: 'abc' })
        .then(function () { done('Did not reject correctly.'); })
        .catch(TaskError, function (err) {
          expect(err.data.task).to.equal('cluster-instance-delete');
          expect(error.rejectAndReport.calledWith(err)).to.be.true();
          expect(err.data.originalError).to.equal(updateError);
          done();
        })
        .catch(done);
    });
  }); // end 'cluster-instance-delete'
});
