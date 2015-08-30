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

var db = require('database');
var dbFixture = require('../../fixtures/database.js');
var clusterProvision = require('tasks/cluster-provision');
var queue = require('queue');

describe('functional', function() {
  describe('tasks', function() {
    describe('cluster-provision', function() {
      var githubId = '1245';

      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        sinon.stub(queue, 'publish');
        dbFixture.createCluster('exists', { 'github_id': githubId })
          .asCallback(done);
      });
      afterEach(function (done) {
        queue.publish.restore();
        done();
      });

      it('should add the cluster to the database', function(done) {
        var job = { githubId: 'does-not-exist' };
        clusterProvision(job)
          .then(function () {
            return db.count().table('clusters');
          })
          .then(function (rows) {
            expect(rows[0].count).to.equal('2');
            done();
          })
          .catch(function (err) {
            console.log(err);
            done(err);
          });
      });

      it('should not add the cluster if it already exists', function(done) {
        var job = { githubId: githubId };
        clusterProvision(job)
          .then(function () {
            return db.count().table('clusters');
          })
          .then(function (rows) {
            expect(rows[0].count).to.equal('1');
            done();
          })
          .catch(done);
      });
    }); // end 'cluster-provision'
  }); // end 'tasks'
}); // end 'functional'
