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

// People may have legit keys in their default environment, they may not work
// so hack them out before loading the environment.
delete process.env.AWS_ACCESS_KEY_ID;
delete process.env.AWS_SECRET_ACCESS_KEY;
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var exists = require('101/exists');
var LaunchConfiguration = require(
  process.env.ASTRAL_ROOT + 'shiva/models/launch-configuration');
var AutoScalingGroup = require(
  process.env.ASTRAL_ROOT + 'shiva/models/auto-scaling-group');

describe('shiva', function() {
  describe('integration', function() {
    describe('models', function () {
      describe('auto-scaling-group', function () {
        var orgName = 'testorg';
        var asgName = AutoScalingGroup._getName(orgName);

        before(function (done) {
          LaunchConfiguration.create(
            process.env.AWS_LAUNCH_CONFIGURATION_NAME
          ).asCallback(done);
        });

        after(function (done) {
          LaunchConfiguration.remove(
            process.env.AWS_LAUNCH_CONFIGURATION_NAME
          ).asCallback(done);
        });

        it('should create a new auto-scaling group', function(done) {
          AutoScalingGroup.create(orgName).asCallback(done);
        });

        it('should describe an auto-scaling group', function(done) {
          AutoScalingGroup.get(orgName)
            .then(function (data) {
              var groups = data.AutoScalingGroups;
              expect(groups.length).to.equal(1);
              expect(groups[0].AutoScalingGroupName).to.equal(asgName);
              done();
            })
            .catch(done);
        });

        it('should update an auto-scaling group', function(done) {
          var cooldown = 14000;
          AutoScalingGroup.update(orgName, { DefaultCooldown: cooldown })
            .then(function () {
              return AutoScalingGroup.get(orgName);
            })
            .then(function (data) {
              var groups = data.AutoScalingGroups;
              expect(groups.length).to.equal(1);
              expect(groups[0].DefaultCooldown).to.equal(cooldown);
              done();
            })
            .catch(done);
        });

        it('should remove an auto-scaling group', function(done) {
          AutoScalingGroup.remove(orgName).asCallback(done);
        });
      }) // end 'auto-scaling-group'
    }); // end 'integration'
  }); // end 'integration'
}); // end 'shiva'
