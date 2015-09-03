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

var dbFixture = require('../fixtures/database.js');

var server = require('server');
var queue = require('queue');
var Cluster = require('models/cluster');
var Instance = require('models/instance');

describe('integration', function() {
  describe('server', function() {
    var githubId = 'example-org';
    var ids = [];

    before(dbFixture.terminateInstances);
    before(dbFixture.truncate);
    before(server.start);
    after(server.stop);

    it('should provision a full cluster', function(done) {
      queue.publish('cluster-provision', { githubId: githubId });
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

    it('should remove instances via terminate-instances job', function(done) {
      if (ids.length === 0) {
        done('Server tests must be run as a suite.');
      }

      ids.forEach(function (id) {
        queue.publish('cluster-instance-terminate', { instanceId: id });
      });

      var interval = setInterval(function () {
        Cluster.getByGithubId(githubId)
          .then(function (cluster) {
            return Instance.select().where({ cluster_id: cluster.id });
          })
          .then(function (rows) {
            var allDeleted = rows
              .map(function (row) { return row.deleted !== null; })
              .reduce(function (memo, curr) { return memo && curr; }, true);
            if (allDeleted) {
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
