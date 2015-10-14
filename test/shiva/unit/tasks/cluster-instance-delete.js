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

var knex = require('knex');
var Promise = require('bluebird');
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;
var Instance = require('models/instance');

var clusterInstanceDelete = require('tasks/cluster-instance-delete');

describe('tasks', function() {
  describe('cluster-instance-delete', function() {

    beforeEach(function (done) {
      sinon.stub(Instance, 'softDelete').returns(Promise.resolve());
      done();
    });

    afterEach(function (done) {
      Instance.softDelete.restore();
      done();
    });

    it('should fatally reject without a job', function(done) {
      clusterInstanceDelete().asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/non-object job/);
        done();
      });
    });

    it('should fatally reject without `instanceId` of type {string}', function(done) {
      clusterInstanceDelete({}).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/id.*string/);
        done();
      });

    });

    it('should fatally reject if `instanceId` is empty', function(done) {
      clusterInstanceDelete({ instanceId: '' }).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/id.*empty/);
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
