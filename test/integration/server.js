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

describe('integration', function() {
  describe('server', function() {
    var clusterId = 'example-org';

    before(dbFixture.terminateInstances);
    before(dbFixture.truncate);
    before(server.start);
    after(server.stop);
    after(dbFixture.terminateInstances)
    after(dbFixture.truncate);

    it('should provision a full cluster', function(done) {
      queue.publish('cluster-provision', { org_id: clusterId });
      var interval = setInterval(function() {
        Cluster.countInstances(clusterId, 'run')
          .then(function (count) {
            if (count === process.env.RUN_INSTANCE_MAX_COUNT) {
              clearInterval(interval);
              done();
            }
          })
          .catch(function (err) {
            clearInterval(interval);
            done(err);
          });
      }, 5000);
    });
  }); // end 'server'
}); // end 'integration'
