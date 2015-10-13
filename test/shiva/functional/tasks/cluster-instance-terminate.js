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

var dbFixture = require('../../fixtures/database');

var Promise = require('bluebird');
var queue = require('queue');
var aws = require('providers/aws');
var TaskFatalError = require('errors/task-fatal-error');
var clusterInstanceTerminate = require('tasks/cluster-instance-terminate');

describe('functional', function() {
  describe('tasks', function() {
    describe('cluster-instance-terminate', function() {
      var instanceId = 'i-abc123';

      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster('1')
          .then(function () {
            return dbFixture.createInstance(instanceId, '1');
          })
          .asCallback(done);
      });

      beforeEach(function (done) {
        sinon.stub(queue, 'publish');
        sinon.stub(aws, 'terminateInstances').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        queue.publish.restore();
        aws.terminateInstances.restore();
        done();
      });

      it('should terminate an existing instance', function(done) {
        clusterInstanceTerminate({ instanceId: instanceId })
          .then(function () {
            expect(aws.terminateInstances.calledOnce).to.be.true();
            expect(queue.publish.calledOnce).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should not terminate a non-existant instance', function(done) {
        clusterInstanceTerminate({ instanceId: 'not-a-thing' })
          .then(function () { done('Did not throw an error.'); })
          .catch(TaskFatalError, function (err) {
            expect(err.data.task).to.equal('cluster-instance-terminate');
            expect(aws.terminateInstances.callCount).to.equal(0);
            expect(queue.publish.callCount).to.equal(0);
            done();
          })
          .catch(done);
      });
    });
  }); // end 'tasks'
}); // end 'functional'
