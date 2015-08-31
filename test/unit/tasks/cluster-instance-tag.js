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

    it('should fatally reject when given invalid `role`', function(done) {
      var job = { org: 'some-org', instanceIds: '1' };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject when given invalid `org`', function(done) {
      var job = { role: 'dock', instanceIds: '1' };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject with a non-scalar `org`', function(done) {
      var job = { role: 'dock', instanceIds: '1', org: [1, 2, 3]};
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should fatally reject when given invalid `instanceId`', function(done) {
      var job = {
        role: 'dock',
        org: 'some-org',
        instanceId: {}
      };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.exist();
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.data.task).to.equal('cluster-instance-tag');
        expect(error.rejectAndReport.calledWith(err)).to.be.true();
        done();
      });
    });

    it('should allow numeric `org` tag', function(done) {
      var job = {
        org: 1345,
        role: 'dock',
        instanceId: 'some-id'
      };
      clusterInstanceTag(job).asCallback(function (err) {
        expect(err).to.not.exist();
        done();
      });
    });

    it('should call aws `createTags` with the correct tags', function(done) {
      var instanceId = '1';
      var job = {
        org: 'org-id',
        role: 'dock',
        instanceId: instanceId
      };
      clusterInstanceTag(job).then(function () {
        expect(aws.createTags.calledOnce).to.be.true();
        expect(aws.createTags.firstCall.args[0]).to.deep.equal({
          Resources: [ instanceId ],
          Tags: [
            { Key: 'org', Value: job.org },
            { Key: 'role', Value: job.role }
          ]
        });
        done();
      }).catch(done);
    });

    it('should convert numeric `org` param to a string', function(done) {
      var instanceId = '1';
      var job = {
        org: 12343545,
        role: 'dock',
        instanceId: instanceId
      };
      clusterInstanceTag(job).then(function () {
        expect(aws.createTags.calledOnce).to.be.true();
        expect(aws.createTags.firstCall.args[0]).to.deep.equal({
          Resources: [ instanceId ],
          Tags: [
            { Key: 'org', Value: job.org.toString() },
            { Key: 'role', Value: job.role }
          ]
        });
        done();
      }).catch(done);
    });

  }); // end 'cluster-instance-tag'
}); // end 'tasks'
