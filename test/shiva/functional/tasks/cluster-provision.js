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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var dbFixture = require(process.env.ASTRAL_ROOT + '../test/fixtures/database.js');
var db = require(process.env.ASTRAL_ROOT + 'common/database');
var clusterProvision = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-provision');
var server = require(process.env.ASTRAL_ROOT + 'shiva/server');

describe('shiva', function() {
  describe('functional', function() {
    describe('tasks', function() {
      describe('cluster-provision', function() {
        var githubId = '1245';

        beforeEach(dbFixture.truncate);
        beforeEach(function (done) {
          sinon.stub(server.hermes, 'publish');
          dbFixture.createCluster('exists', { 'github_id': githubId })
            .asCallback(done);
        });
        afterEach(function (done) {
          server.hermes.publish.restore();
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
}); // end 'shiva'
