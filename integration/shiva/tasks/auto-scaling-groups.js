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

var dbFixture = require('../../../test/fixtures/database.js');
var server = astralRequire('shiva/server');
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group');
var LaunchConfiguration = astralRequire('shiva/models/launch-configuration');

describe('shiva', function() {
  describe('integration', function() {
    describe('tasks', function () {
      var githubId = 'integration-testing-org';
      var asgName = AutoScalingGroup._getName(githubId);
      var maxCheckAttempts = 30;
      var checkDelay = 1500;

      before(dbFixture.terminateInstances);
      before(dbFixture.truncate);

      before(function (done) {
        server.start()
          .then(function () {
            return LaunchConfiguration.create(
              process.env.AWS_LAUNCH_CONFIGURATION_NAME
            );
          })
          .asCallback(done);
      });

      after(function (done) {
        LaunchConfiguration.remove(process.env.AWS_LAUNCH_CONFIGURATION_NAME)
          .then(function () {
            return server.stop();
          })
          .asCallback(done);
      });

      describe('asg.create', function() {
        it('should create an auto-scaling group', function(done) {
          server.hermes.publish('asg.create', { githubId: githubId });
          var attempt = 0;
          var checkInterval = setInterval(function () {
            AutoScalingGroup.get(githubId)
              .then(function (data) {
                var groupCreated =  data.AutoScalingGroups.some(function (group) {
                  return group.AutoScalingGroupName === asgName;
                });
                if (groupCreated) {
                  clearInterval(checkInterval);
                  done();
                }
                if (++attempt === maxCheckAttempts) {
                  done(new Error(
                    'Creation of the auto-scaling group failed after ' + attempt +
                    ' checks.'
                  ));
                }
              })
              .catch(done);
          }, checkDelay);
        });
      }); // end 'asg.create'

      describe('asg.update', function () {
        it('should update the auto-scaling group', function (done) {
          var maxSize = 8;
          var job = {
            githubId: githubId,
            data: {
              MaxSize: maxSize
            }
          };

          server.hermes.publish('asg.update', job);

          var attempt = 0;
          var checkInterval = setInterval(function () {
            AutoScalingGroup.get(githubId)
              .then(function (data) {
                var group = data.AutoScalingGroups[0];
                if (group && group.MaxSize === maxSize) {
                  clearInterval(checkInterval);
                  done();
                }
                else if (!group) {
                  throw new Error('Group did not exist.');
                }
                else if (++attempt === maxCheckAttempts) {
                  throw new Error(
                    'Creation of the auto-scaling group failed after ' + attempt +
                    ' checks.'
                  );
                }
              })
              .catch(done);
          }, checkDelay);
        });
      }); // end 'asg.update'

      describe('asg.delete', function () {
        it('should remove an auto-scaling group', function (done) {
          server.hermes.publish('asg.delete', { githubId: githubId });
          var attempt = 0;
          var checkInterval = setInterval(function () {
            AutoScalingGroup.get(githubId)
              .then(function (data) {
                if (data.AutoScalingGroups.length === 0) {
                  clearInterval(checkInterval);
                  done();
                }
                if (++attempt === maxCheckAttempts) {
                  done(new Error(
                    'Removal of the auto-scaling group failed after ' + attempt +
                    ' checks.'
                  ));
                }
              })
              .catch(done);
          }, checkDelay);
        });
      }); // end 'asg.delete'
    }); // end 'tasks'
  }); // end 'integration'
}); // end 'shiva'
