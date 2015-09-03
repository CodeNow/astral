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

var db = require('database');
var dbFixture = require('../../fixtures/database.js');
var clusterInstanceDelete = require('tasks/cluster-instance-delete');

describe('functional', function() {
  describe('tasks', function() {
    describe('cluster-instance-delete', function() {
      var instanceId = 'i-12349';

      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster('1')
          .then(function () {
            return dbFixture.createInstance(instanceId, '1')
          })
          .asCallback(done)
      });

      it('should delete the instance from the database', function(done) {
        clusterInstanceDelete({ id: instanceId })
          .then(function () {
            return db('instances').select().where({ id: instanceId });
          })
          .then(function (rows) {
            expect(rows.length).to.equal(1);
            expect(rows[0].deleted).to.not.be.null();
            done();
          })
          .catch(done);
      });
    }); // end 'cluster-instance-delete'
  }); // end 'tasks'
}); // end 'functional'
