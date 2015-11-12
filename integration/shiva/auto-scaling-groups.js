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
var path = require('path');

var astralRequire = require(path.resolve(
  process.env.ASTRAL_ROOT,
  '../test/fixtures/astral-require'
));
var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var dbFixture = require('../../test/fixtures/database.js');
var server = astralRequire('shiva/server');
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group');

describe('shiva', function() {
  describe('integration', function() {
    describe('auto-scaling groups', function() {
      var githubId = 'integration-testing-org';

      before(dbFixture.terminateInstances);
      before(dbFixture.truncate);
      before(function (done) { server.start().asCallback(done); });
      after(function (done) { server.stop().asCallback(done); });

      it('should create an auto-scaling group', function(done) {
        server.hermes.publish('shiva-asg-create', { githubId: githubId });
        setTimeout(done, 1000);
      });

      it('should deprovision the cluster', function(done) {
        server.hermes.publish('shiva-asg-delete', { githubId: githubId });
        setTimeout(done, 1000);
      });
    }); // end 'auto-scaling groups'
  }); // end 'integration'
}); // end 'shiva'
