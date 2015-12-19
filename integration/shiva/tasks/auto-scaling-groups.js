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

/**
 * Options for running integration test instances (primarily used to test the
 * asg.instance.terminate worker).
 * @type {Object}
 */
const INSTANCE_OPTIONS = {
  MaxCount: 1,
  MinCount: 1,
  KeyName: 'integration-testing',
  Monitoring: { Enabled: false },
  SubnetId: 'subnet-5862f92f',
  SecurityGroupIds: ['sg-78b0011c'],
  ImageId: 'ami-33716203',
  InstanceType: 't2.micro',
  InstanceInitiatedShutdownBehavior: 'terminate'
};

var astralRequire = require(path.resolve(
  process.env.ASTRAL_ROOT,
  '../test/fixtures/astral-require'
));
var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var isEmpty = require('101/is-empty');

var dbFixture = require('../../../test/fixtures/database.js');
var server = astralRequire('shiva/server');
var AutoScalingGroup = astralRequire('shiva/models/auto-scaling-group');
var LaunchConfiguration = astralRequire('shiva/models/launch-configuration');
var ec2 = astralRequire('shiva/models/aws/ec2');

describe('shiva', function() {
  describe('integration', function() {
    describe('tasks', function () {
      var githubId = 'integration-testing-org';
      var asgName = AutoScalingGroup._getName(githubId);
      var maxCheckAttempts = 30;
      var checkDelay = 1500;

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

      describe('asg.instance.terminate', function () {
        var instanceId = '';

        describe('by `instanceId`', function () {
          before(function (done) {
            ec2.runInstancesAsync(INSTANCE_OPTIONS)
              .then(function (data) {
                instanceId = data.Instances[0].InstanceId;
                return ec2.waitForAsync('instanceRunning', {
                  InstanceIds: [ instanceId ]
                });
              })
              .asCallback(done);
          });

          it('should terminate the instance', function (done) {
            if (isEmpty(instanceId)) {
              done(new Error('Failed to create an EC2 instance'));
            }

            server.hermes.publish('asg.instance.terminate', {
              instanceId: instanceId
            });

            var options = { InstanceIds: [instanceId] };
            ec2.waitForAsync('instanceTerminated', options).asCallback(done);
          });
        }); // end 'by `instanceId`'

        describe('by `ipAddress`', function () {
          var instanceId = '';
          var ipAddress = '';


          before(function (done) {
            ec2.runInstancesAsync(INSTANCE_OPTIONS)
              .then(function (data) {
                instanceId = data.Instances[0].InstanceId;
                var options = { InstanceIds: [ instanceId ] };
                return ec2.waitForAsync('instanceRunning', options)
                  .then(function () {
                    return ec2.describeInstancesAsync(options)
                  })
                  .then(function (data) {
                    var instances = [];
                    data.Reservations.forEach(function (res) {
                      instances = instances.concat(res.Instances);
                    });
                    ipAddress = instances[0].PrivateIpAddress;
                  });
              })
              .asCallback(done);
          });

          it('should terminate the instance', function (done) {
            if (isEmpty(instanceId) || isEmpty(ipAddress)) {
              done(new Error('Failed to create an EC2 instance'));
            }

            server.hermes.publish('asg.instance.terminate', {
              ipAddress: ipAddress
            });

            var options = { InstanceIds: [instanceId] };
            ec2.waitForAsync('instanceTerminated', options).asCallback(done);
          });
        });
      });
    }); // end 'tasks'
  }); // end 'integration'
}); // end 'shiva'
