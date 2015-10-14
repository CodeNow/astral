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
var aws = require('aws');
var TaskFatalError = require('ponos').TaskFatalError;
var clusterInstanceTerminate = require('tasks/cluster-instance-terminate');
var server = require('server').getInstance();;

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
        sinon.stub(server.hermes, 'publish');
        sinon.stub(aws, 'terminateInstances').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        server.hermes.publish.restore();
        aws.terminateInstances.restore();
        done();
      });

      it('should terminate an existing instance', function(done) {
        clusterInstanceTerminate({ instanceId: instanceId })
          .then(function () {
            expect(aws.terminateInstances.calledOnce).to.be.true();
            expect(server.hermes.publish.calledOnce).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should not terminate a non-existant instance', function(done) {
        clusterInstanceTerminate({ instanceId: 'not-a-thing' })
          .then(function () { done('Did not throw an error.'); })
          .catch(TaskFatalError, function (err) {
            expect(aws.terminateInstances.callCount).to.equal(0);
            expect(server.hermes.publish.callCount).to.equal(0);
            done();
          })
          .catch(done);
      });
    });
  }); // end 'tasks'
}); // end 'functional'
