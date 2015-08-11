'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

require('loadenv')('shiva:test');

var hermes = require('queue');
var db = require('database');
var dbFixture = require('../../fixtures/database.js');
var checkClusterReady = require('tasks/check-cluster-ready');

describe('functional', function() {
  describe('tasks', function() {
    describe('check-cluster-ready', function() {
      var originalInterval;

      beforeEach(dbFixture.truncate);

      beforeEach(function (done) {
        originalInterval = process.env.CLUSTER_READY_INTERVAL;
        process.env.CLUSTER_READY_INTERVAL = 10;
        sinon.spy(hermes, 'publish');
        dbFixture.createCluster('1')
          .then(function () {
            return dbFixture.createInstance('a', '1', { type: 'run' });
          })
          .then(function () {
            return dbFixture.createInstance('b', '1', { type: 'build' });
          })
          .asCallback(done);
      });

      afterEach(function (done) {
        process.env.CLUSTER_READY_INTERVAL = originalInterval;
        hermes.publish.restore();
        done();
      });

      it('should use the database to check for cluster ready', function(done) {
        var job = { cluster_id: '1' };
        checkClusterReady(job).then(function () {
          expect(hermes.publish.calledOnce).to.be.true();
          expect(hermes.publish.calledWith('cluster-ready')).to.be.true();
          expect(hermes.publish.firstCall.args[1]).to.deep.equal({
            org_id: '1'
          });
          done()
        }).catch(done);
      });
    }); // end 'check-cluster-ready'
  }); // end 'tasks'
}); // end 'functional'
