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

var dbFixture = require(process.env.ASTRAL_ROOT + '../test/fixtures/database.js');
var Instance = require(process.env.ASTRAL_ROOT + 'shiva/models/instance');
var db = require(process.env.ASTRAL_ROOT + 'common/database');
var clusterInstanceDelete = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-instance-delete');

describe('shiva', function() {
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

        beforeEach(function (done) {
          sinon.spy(Instance, 'softDelete');
          done();
        })

        afterEach(function (done) {
          Instance.softDelete.restore();
          done();
        });

        it('should always perform soft delete', function(done) {
          clusterInstanceDelete({ instanceId: 'not-there' })
            .then(function () {
              expect(Instance.softDelete.callCount).to.equal(1);
              done();
            })
            .catch(done);
        });
      }); // end 'cluster-instance-delete'
    }); // end 'tasks'
  }); // end 'functional'
}); // end 'shiva'
