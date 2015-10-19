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

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var dbFixture = require('../../test/shiva/fixtures/database.js');

var server = require(process.env.ASTRAL_ROOT + 'shiva/server');
var Cluster = require(process.env.ASTRAL_ROOT + 'shiva/models/cluster');
var Instance = require(process.env.ASTRAL_ROOT + 'shiva/models/instance');

describe('shiva', function() {
  describe('integration', function() {
    describe('server', function() {
      var githubId = 'example-org';
      var ids = [];

      before(dbFixture.terminateInstances);
      before(dbFixture.truncate);
      before(function (done) { server.start().asCallback(done); });
      after(function (done) { server.stop().asCallback(done); });

      it('should provision a full cluster', function(done) {
        server.hermes.publish('cluster-provision', { githubId: githubId });
        var interval = setInterval(function() {
          Cluster.getByGithubId(githubId)
            .then(function (cluster) {
              return Instance.count()
                .where({ cluster_id: cluster.id })
                .map(function (row) { return row.count; })
                .reduce(function (memo, row) { return memo + parseInt(row); }, 0)
                .then(function (count) {
                  if (count === process.env.CLUSTER_INITIAL_DOCKS) {
                    clearInterval(interval);
                    return Instance.select('id').where({ cluster_id: cluster.id })
                      .then(function (rows) {
                        ids = rows.map(function (instance) {
                          return instance.id;
                        });
                        done();
                      });
                  }
                });
            })
            .catch(function (err) {
              clearInterval(interval);
              done(err);
            });
        }, 1000);
      });

      it('should deprovision the cluster', function(done) {
        if (ids.length === 0) {
          done('Server tests must be run as a suite.');
        }

        server.hermes.publish('cluster-deprovision', { githubId: githubId });

        var interval = setInterval(function () {
          Cluster.getByGithubId(githubId)
            .then(function (cluster) {
              if (!cluster) {
                clearInterval(interval);
                done();
              }
            })
            .catch(function (err) {
              clearInterval(interval);
              done(err);
            });
        }, 1000);
      });
    }); // end 'server'
  }); // end 'integration'
}); // end 'shiva'
