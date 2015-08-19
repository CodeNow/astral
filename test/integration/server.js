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
    before(function (done) {
      server.start(done);
    });

    after(function (done) {
      server.stop(done);
    });

    beforeEach(dbFixture.truncate);

    describe('cluster-provision', function() {
      it('should create a new cluster', function(done) {
        var clusterId = 'example-org';

        queue.publish('cluster-provision', { org_id: clusterId });

        var interval = setInterval(function() {
          Cluster.countInstances(clusterId, 'run')
            .then(function (count) {
              if (count > 0) {
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
    }); // end 'cluster-provision'
  }); // end 'server'
}); // end 'integration'
