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

var fs = require('fs');
var path = require('path');
var Mustache = require('mustache');
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

    describe('constructor', function() {
      it('should fetch the correct user data script template', function(done) {
        var templatePath = path.resolve(
          __dirname,
          '../../../scripts/aws-instance-user-data.sh'
        );
        var expectedTemplate = fs.readFileSync(templatePath).toString();
        expect(aws.userDataTemplate).to.equal(expectedTemplate);
        done();
      });
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

      it('should set the correct `UserData` param', function(done) {
        aws.createInstances(cluster).then(function (instances) {
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(aws.getUserDataScript.calledOnce).to.be.true();
          expect(params.UserData).to.equal(new Buffer(
            aws.getUserDataScript(cluster)
          ).toString('base64'));
          done();
        }).catch(done);
      });

      it('should use the given number of instances', function(done) {
        var numInstances = 2034
        aws.createInstances(cluster, numInstances).then(function () {
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(params.MinCount).to.equal(numInstances);
          expect(params.MaxCount).to.equal(numInstances);
          done();
        }).catch(done);
      });

      it('should resolve with aws response instances', function(done) {
        aws.createInstances(cluster).then(function (instances) {
          expect(instances).to.equal(instanceResponse.Instances);
          done();
        }).catch(done);
      });

      it('should handle error responses', function(done) {
        var ec2Error = new Error('Yup, the whole AZ fell into a pit...');
        aws.ec2.runInstances.yieldsAsync(ec2Error);
        aws.createInstances(cluster).asCallback(function (err) {
          expect(err).to.equal(ec2Error);
          done();
        });
      });
    }); // end 'createInstances'

    describe('getUserDataScript', function() {
      var cluster = { id: 'cluster-id' };

      beforeEach(function (done) {
        sinon.spy(Mustache, 'render');
        done();
      });

      afterEach(function (done) {
        Mustache.render.restore();
        done();
      });

      it('should render the correct template', function(done) {
        var result = aws.getUserDataScript(cluster);
        expect(Mustache.render.calledWith(aws.userDataTemplate)).to.be.true();
        done();
      });

      it('should return the rendered template', function(done) {
        var result = aws.getUserDataScript(cluster);
        expect(result).to.equal(Mustache.render.returnValues[0]);
        done();
      });

      it('should set the correct tags', function(done) {
        var tags = [cluster.id, 'run', 'build'].join(',');
        aws.getUserDataScript(cluster);
        expect(Mustache.render.firstCall.args[1].host_tags).to.equal(tags);
        done();
      });

      it('should set the correct filibuster_version', function(done) {
        var variableName = 'filibuster_version';
        var expectedVariable = process.env.FILIBUSTER_VERSION;
        aws.getUserDataScript(cluster);
        expect(Mustache.render.firstCall.args[1][variableName])
          .to.equal(expectedVariable);
        done();
      });

      it('should set the correct krain_version', function(done) {
        var variableName = 'krain_version';
        var expectedVariable = process.env.KRAIN_VERSION;
        aws.getUserDataScript(cluster);
        expect(Mustache.render.firstCall.args[1][variableName])
          .to.equal(expectedVariable);
        done();
      });

      it('should set the correct sauron_version', function(done) {
        var variableName = 'sauron_version';
        var expectedVariable = process.env.SAURON_VERSION;
        aws.getUserDataScript(cluster);
        expect(Mustache.render.firstCall.args[1][variableName])
          .to.equal(expectedVariable);
        done();
      });

      it('should set the correct image_builder_version', function(done) {
        var variableName = 'image_builder_version';
        var expectedVariable = process.env.IMAGE_BUILDER_VERSION;
        aws.getUserDataScript(cluster);
        expect(Mustache.render.firstCall.args[1][variableName])
          .to.equal(expectedVariable);
        done();
      });

      it('should set the correct docker_listener_version', function(done) {
        var variableName = 'docker_listener_version';
        var expectedVariable = process.env.DOCKER_LISTENER_VERSION;
        aws.getUserDataScript(cluster);
        expect(Mustache.render.firstCall.args[1][variableName])
          .to.equal(expectedVariable);
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
      it('should set the correct `ImageId`', function(done) {
        var key = 'ImageId';
        var value = process.env.AWS_INSTANCE_IMAGE_ID;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `MinCount`', function(done) {
        var key = 'MinCount';
        var value = process.env.AWS_INSTANCE_COUNT;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `MaxCount`', function(done) {
        var key = 'MaxCount';
        var value = process.env.AWS_INSTANCE_COUNT;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `InstanceType`', function(done) {
        var key = 'InstanceType';
        var value = process.env.AWS_INSTANCE_TYPE;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `InstanceInitiatedShutdownBehavior`', function(done) {
        var key = 'InstanceInitiatedShutdownBehavior';
        var value = process.env.AWS_SHUTDOWN_BEHAVIOR;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `KeyName` param', function(done) {
        var key = 'KeyName';
        var value = process.env.AWS_SSH_KEY_NAME;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `SecurityGroupIds` param', function(done) {
        var key = 'SecurityGroupIds';
        var values = [
          process.env.AWS_BASTION_SECURITY_GROUP,
          process.env.AWS_CLUSTER_SECURITY_GROUP_ID
        ];
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.deep.equal(values);
        done();
      });

      it('should set the correct `SubnetId` param', function(done) {
        var key = 'SubnetId';
        var value = process.env.AWS_CLUSTER_SUBNET;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });
    }); // end 'getDefaultInstanceParams'
  }); // end 'aws'
}); // end 'providers'
