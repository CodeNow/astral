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

require('loadenv')('shiva:test');

var Promise = require('bluebird');
var aws = require('providers/aws');

describe('providers', function() {
  describe('aws', function() {
    var instanceResponse = {
      Instances: [
        { InstanceId: '1' },
        { InstanceId: '2' }
      ]
    };
    var waitForResponse = { foo: 'bar' };
    var createTagsResponse = { bar: 'far' };
    var terminateInstancesResponse = { near: 'scar' };

    beforeEach(function (done) {
      sinon.stub(aws.ec2, 'runInstances')
        .yieldsAsync(null, instanceResponse);
      sinon.stub(aws.ec2, 'waitFor')
        .yieldsAsync(null, waitForResponse);
      sinon.stub(aws.ec2, 'createTags')
        .yieldsAsync(null, createTagsResponse);
      sinon.stub(aws.ec2, 'terminateInstances')
        .yieldsAsync(null, terminateInstancesResponse);
      done();
    });

    afterEach(function (done) {
      aws.ec2.runInstances.restore();
      aws.ec2.waitFor.restore();
      aws.ec2.createTags.restore();
      aws.ec2.terminateInstances.restore();
      done();
    });

    describe('createInstances', function() {
      var cluster = {
        id: 'cluster-id',
        ssh_key_name: 'ssh-key-name',
        security_group_id: 'security-group-id',
        subnet_id: 'subnet-id'
      };

      beforeEach(function (done) {
        sinon.spy(aws, 'getDefaultInstanceParams');
        sinon.spy(aws, 'getUserDataScript');
        done();
      });

      afterEach(function (done) {
        aws.getDefaultInstanceParams.restore();
        aws.getUserDataScript.restore();
        done();
      });

      it('should return a promise', function(done) {
        expect(aws.createInstances(cluster, 'run', 3).then).to.be.a.function();
        done();
      });

      it('should set the correct `KeyName` param', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(aws.getDefaultInstanceParams.calledOnce).to.be.true();
          expect(aws.ec2.runInstances.calledOnce).to.be.true();
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(params.KeyName).to.equal(cluster.ssh_key_name);
          done();
        }).catch(done);
      });

      it('should set the correct `SecurityGroupIds` param', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(aws.getDefaultInstanceParams.calledOnce).to.be.true();
          expect(aws.ec2.runInstances.calledOnce).to.be.true();
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(params.SecurityGroupIds).to.deep.equal([
            cluster.security_group_id
          ]);
          done();
        }).catch(done);
      });

      it('should set the correct `SubnetId` param', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(aws.getDefaultInstanceParams.calledOnce).to.be.true();
          expect(aws.ec2.runInstances.calledOnce).to.be.true();
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(params.SubnetId).to.equal(cluster.subnet_id);
          done();
        }).catch(done);
      });

      it('should set the correct `UserData` param', function(done) {
        var type = 'run';
        aws.createInstances(cluster, type).then(function (instances) {
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(aws.getUserDataScript.calledOnce).to.be.true();
          expect(params.UserData).to.equal(new Buffer(
            aws.getUserDataScript(cluster, type)
          ).toString('base64'));
          done();
        }).catch(done);
      });

      it('should use the given number of instances', function(done) {
        var numInstances = 2034
        aws.createInstances(cluster, 'run', numInstances).then(function () {
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(params.MinCount).to.equal(numInstances);
          expect(params.MaxCount).to.equal(numInstances);
          done();
        }).catch(done);
      });

      it('should resolve with aws response instances', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(instances).to.equal(instanceResponse.Instances);
          done();
        }).catch(done);
      });

      it('should handle error responses', function(done) {
        var ec2Error = new Error('Yup, the whole AZ fell into a pit...');
        aws.ec2.runInstances.yieldsAsync(ec2Error);
        aws.createInstances(cluster, 'run').asCallback(function (err) {
          expect(err).to.equal(ec2Error);
          done();
        });
      });
    }); // end 'createInstances'

    describe('getUserDataScript', function() {
      it('should generate a script with the correct tags', function(done) {
        var cluster = { id: 'cluster-id' };
        var type = 'build';
        var tags = [cluster.id, type].join(',');
        var expected = [
          '#!/bin/sh',
          'PROFILE_FILE=/etc/profile.d/runnable-host-tags.sh',
          'echo \'#!/bin/sh\' >> $PROFILE_FILE',
          'echo \'export HOST_TAGS=' + tags +  '\' >> $PROFILE_FILE'
        ].join('\n');
        expect(aws.getUserDataScript(cluster, type)).to.equal(expected);
        done();
      });
    }); // end 'getUserDataScript'

    describe('waitFor', function() {
      it('should return a promise', function(done) {
        expect(aws.waitFor('instancesRunning', {}).then).to.be.a.function();
        done();
      });

      it('should correctly call ec2 `waitFor`', function(done) {
        var waitingFor = 'instanceRunning';
        var params = { neato: 'elito' };
        aws.waitFor(waitingFor, params)
          .then(function (data) {
            expect(aws.ec2.waitFor.calledOnce).to.be.true();
            expect(aws.ec2.waitFor.calledWith(
              waitingFor,
              params
            )).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should handle success responses', function(done) {
        aws.waitFor('instancesTerminated', {})
          .then(function (data) {
            expect(data).to.deep.equal(waitForResponse);
            done();
          })
          .catch(done);
      });

      it('should handle error responses', function(done) {
        var ec2Error = new Error('EC2 does not like you. Go away.');
        aws.ec2.waitFor.yieldsAsync(ec2Error);
        aws.waitFor('anything', {}).asCallback(function (err) {
          expect(err).to.equal(ec2Error);
          done();
        });
      });
    }); // end 'waitFor'

    describe('terminateInstances', function() {
      it('should return a promise', function(done) {
        expect(aws.terminateInstances({}).then).to.be.a.function();
        done();
      });

      it('should correctly call ec2 `terminateInstances`', function(done) {
        var params = { neat: 'sweet' };
        aws.terminateInstances(params)
          .then(function () {
            expect(aws.ec2.terminateInstances.calledOnce).to.be.true();
            expect(aws.ec2.terminateInstances.calledWith(params)).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should handle success responses', function(done) {
        aws.terminateInstances({})
          .then(function (data) {
            expect(data).to.deep.equal(terminateInstancesResponse);
            done();
          })
          .catch(done);
      });

      it('should handle error responses', function(done) {
        var ec2Error = new Error('All your security group r belong 2 us');
        aws.ec2.terminateInstances.yieldsAsync(ec2Error);
        aws.terminateInstances({}).asCallback(function (err) {
          expect(err).to.equal(ec2Error);
          done();
        });
      });
    }); // end 'terminateInstances'

    describe('createTags', function() {
      it('should return a promise', function(done) {
        expect(aws.createTags({}).then).to.be.a.function();
        done();
      });

      it('should correctly call ec2 `terminateInstances`', function(done) {
        var params = { neat: 'sweet' };
        aws.createTags(params)
          .then(function () {
            expect(aws.ec2.createTags.calledOnce).to.be.true();
            expect(aws.ec2.createTags.calledWith(params)).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should handle success responses', function(done) {
        aws.createTags({})
          .then(function (data) {
            expect(data).to.deep.equal(createTagsResponse);
            done();
          })
          .catch(done);
      });

      it('should handle error responses', function(done) {
        var ec2Error = new Error('We only accept lambda functions');
        aws.ec2.createTags.yieldsAsync(ec2Error);
        aws.createTags({}).asCallback(function (err) {
          expect(err).to.equal(ec2Error);
          done();
        });
      });
    }); // end 'createTags'

    describe('getDefaultInstanceParams', function() {
      beforeEach(function (done) {
        sinon.spy(aws, 'getTypeEnvironmentPrefix');
        done();
      });

      afterEach(function (done) {
        aws.getTypeEnvironmentPrefix.restore();
        done();
      });

      it('should use the correct environment prefix', function(done) {
        var type = 'run';
        aws.getDefaultInstanceParams(type);
        expect(aws.getTypeEnvironmentPrefix.calledWith(type)).to.be.true();
        done();
      });

      it('should set the correct `ImageId`', function(done) {
        var type = 'run';
        var key = 'ImageId';
        var value = process.env.RUN_INSTANCE_AMI_ID;
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `MinCount`', function(done) {
        var type = 'run';
        var key = 'MinCount';
        var value = process.env.RUN_INSTANCE_MIN_COUNT;
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `MaxCount`', function(done) {
        var type = 'run';
        var key = 'MaxCount';
        var value = process.env.RUN_INSTANCE_MAX_COUNT;
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `InstanceType`', function(done) {
        var type = 'run';
        var key = 'InstanceType';
        var value = process.env.RUN_INSTANCE_TYPE;
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `InstanceInitiatedShutdownBehavior`', function(done) {
        var type = 'run';
        var key = 'InstanceInitiatedShutdownBehavior';
        var value = process.env.AWS_SHUTDOWN_BEHAVIOR;
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `BlockDeviceMappings`', function(done) {
        var type = 'run';
        var key = 'BlockDeviceMappings';
        var value = {
          AvailabilityZone: process.env.AWS_AVAILABILITY_ZONE,
          GroupName: process.env.AWS_GROUP_NAME
        };
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.deep.equal([
          {
            DeviceName: '/dev/sdb',
            Ebs: {
              VolumeSize: 1000,
              DeleteOnTermination: true
            }
          },
          {
            DeviceName: '/dev/sdc',
            Ebs: {
              VolumeSize: 50,
              DeleteOnTermination: true
            }
          },
          {
            DeviceName: '/dev/sdd',
            Ebs: {
              VolumeSize: 50,
              DeleteOnTermination: true
            }
          }
        ]);
        done();
      });
    }); // end 'getDefaultInstanceParams'
  }); // end 'aws'
}); // end 'providers'
