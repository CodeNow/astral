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
var clusterInstanceTag = require('tasks/cluster-instance-tag');

describe('tasks', function() {
  describe('cluster-instance-tag', function() {
    beforeEach(function (done) {
      sinon.spy(error, 'rejectAndReport');
      sinon.stub(aws, 'createTags').returns(Promise.resolve());
      sinon.stub(queue, 'publish');
      sinon.stub(queue, 'subscribe');
      done();
    });

    afterEach(function (done) {
      error.rejectAndReport.restore();
      aws.createTags.restore();
      queue.publish.restore();
      queue.subscribe.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterInstanceTag().asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject when given invalid `type`', function(done) {
      var job = { org: 'some-org', instanceIds: ['1', '2'] };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject when given invalid `org`', function(done) {
      var job = { type: 'run', instanceIds: ['1', '2'] };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject when given invalid `instanceIds`', function(done) {
      var job = { type: 'run', org: 'some-org', instanceIds: {} };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject when given non-string instance id', function(done) {
      var job = {
        type: 'run',
        org: 'some-org',
        instanceIds: [{}, '2']
      };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should call aws `createTags` with the correct tags', function(done) {
      var job = {
        org: 'org-id',
        type: 'run',
        instanceIds: ['1', '2', '3']
      };
      clusterInstanceTag(job).then(function () {
        expect(aws.createTags.calledOnce).to.be.true();
        expect(aws.createTags.firstCall.args[0]).to.deep.equal({
          Resources: job.instanceIds,
          Tags: [
            { Key: 'role', Value: 'dock' },
            { Key: 'type', Value: job.type },
            { Key: 'org', Value: job.org }
          ]
        });
        done();
      }).catch(done);
    });
  }); // end 'cluster-instance-tag'
}); // end 'tasks'
