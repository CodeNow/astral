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
    describe('createInstances', function() {
      var instanceResponse = {
        Instances: [
          { InstanceId: '1' },
          { InstanceId: '2' }
        ]
      };

      var cluster = {
        id: 'cluster-id',
        ssh_key_name: 'ssh-key-name',
        security_group_id: 'security-group-id',
        subnet_id: 'subnet-id'
      };

      beforeEach(function (done) {
        sinon.spy(aws, 'getDefaultInstanceParams');
        sinon.stub(aws, 'runInstances')
          .returns(Promise.resolve(instanceResponse));
        done();
      });

      afterEach(function (done) {
        aws.getDefaultInstanceParams.restore();
        aws.runInstances.restore();
        done();
      });

      it('should return a promise', function(done) {
        expect(aws.createInstances(cluster, 'run', 3).then).to.be.a.function();
        done();
      });

      it('should set the correct `KeyName` param', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(aws.getDefaultInstanceParams.calledOnce).to.be.true();
          expect(aws.runInstances.calledOnce).to.be.true();
          var params = aws.runInstances.firstCall.args[0];
          expect(params.KeyName).to.equal(cluster.ssh_key_name);
          done();
        }).catch(done);
      });

      it('should set the correct `SecurityGroupIds` param', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(aws.getDefaultInstanceParams.calledOnce).to.be.true();
          expect(aws.runInstances.calledOnce).to.be.true();
          var params = aws.runInstances.firstCall.args[0];
          expect(params.SecurityGroupIds).to.deep.equal([
            cluster.security_group_id
          ]);
          done();
        }).catch(done);
      });

      it('should set the correct `SubnetId` param', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(aws.getDefaultInstanceParams.calledOnce).to.be.true();
          expect(aws.runInstances.calledOnce).to.be.true();
          var params = aws.runInstances.firstCall.args[0];
          expect(params.SubnetId).to.equal(cluster.subnet_id);
          done();
        }).catch(done);
      });

      it('should resolve with aws response instances', function(done) {
        aws.createInstances(cluster, 'run').then(function (instances) {
          expect(instances).to.equal(instanceResponse.Instances);
          done();
        }).catch(done);
      });

      it('should use the given number of instances', function(done) {
        var numInstances = 2034
        aws.createInstances(cluster, 'run', numInstances).then(function () {
          var params = aws.runInstances.firstCall.args[0];
          expect(params.MinCount).to.equal(numInstances);
          expect(params.MaxCount).to.equal(numInstances);
          done();
        }).catch(done);
      });
    }); // end 'createInstances'

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

      it('should set the correct `Placement`', function(done) {
        var type = 'run';
        var key = 'Placement';
        var value = {
          AvailabilityZone: process.env.AWS_AVAILABILITY_ZONE,
          GroupName: process.env.AWS_GROUP_NAME
        };
        var params = aws.getDefaultInstanceParams(type);
        expect(params[key]).to.deep.equal(value);
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
