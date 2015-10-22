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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var dbFixture = require(process.env.ASTRAL_ROOT + '../test/fixtures/database');
var TaskFatalError = require('ponos').TaskFatalError;

var aws = require(process.env.ASTRAL_ROOT + 'shiva/aws');
var clusterInstanceTerminate = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-instance-terminate');
var server = require(process.env.ASTRAL_ROOT + 'shiva/server');

describe('shiva', function() {
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
}); // end 'shiva'
