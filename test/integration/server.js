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
    var github_id = 'example-org';

    before(dbFixture.terminateInstances);
    before(dbFixture.truncate);
    before(server.start);
    after(server.stop);
    after(dbFixture.terminateInstances)
    after(dbFixture.truncate);

    it('should provision a full cluster', function(done) {
      queue.publish('cluster-provision', { github_id: github_id });
      var interval = setInterval(function() {
        Cluster.getByGithubId(github_id)
          .then(function (cluster) {
            return Instance.count()
              .where({
                cluster_id: cluster.id
              }).map(function (row) {
                return row.count;
              }).reduce(function (memo, row) {
                return memo + parseInt(row);
              }, 0);
          })
          .then(function (count) {
            if (count === process.env.AWS_INSTANCE_COUNT) {
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
