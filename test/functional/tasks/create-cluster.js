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
var createCluster = require('tasks/create-cluster');

describe('functional', function() {
  describe('tasks', function() {
    describe('create-cluster', function() {
      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster('exists').asCallback(done);
      });

      it('should add the cluster to the database', function(done) {
        var job = { org_id: 'does-not-exist' };
        createCluster(job)
          .then(function () {
            return db.count().table('clusters');
          })
          .then(function (rows) {
            expect(rows[0].count).to.equal('2');
            done();
          })
          .catch(done);
      });

      it('should not add the cluster if it already exists', function(done) {
        var job = { org_id: 'exists' };
        createCluster(job)
          .then(function () {
            return db.count().table('clusters');
          })
          .then(function (rows) {
            expect(rows[0].count).to.equal('1');
            done();
          })
          .catch(done);
      });
    }); // end 'create-cluster'
  }); // end 'tasks'
}); // end 'functional'
