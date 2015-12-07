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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var isObject = require('101/is-object');
var fs = require('fs');
var path = require('path');
var Mustache = require('mustache');

var aws = require(process.env.ASTRAL_ROOT + 'shiva/aws');

describe('shiva', function() {
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
    var describeInstancesResponse = { neat: 'woot' };

    beforeEach(function (done) {
      sinon.stub(aws.ec2, 'runInstances')
        .yieldsAsync(null, instanceResponse);
      sinon.stub(aws.ec2, 'waitFor')
        .yieldsAsync(null, waitForResponse);
      sinon.stub(aws.ec2, 'createTags')
        .yieldsAsync(null, createTagsResponse);
      sinon.stub(aws.ec2, 'terminateInstances')
        .yieldsAsync(null, terminateInstancesResponse);
      sinon.stub(aws.ec2, 'describeInstances')
        .yieldsAsync(null, describeInstancesResponse);
      done();
    });

    afterEach(function (done) {
      aws.ec2.runInstances.restore();
      aws.ec2.waitFor.restore();
      aws.ec2.createTags.restore();
      aws.ec2.terminateInstances.restore();
      aws.ec2.describeInstances.restore();
      done();
    });

    describe('constructor', function() {
      it('should fetch the correct user data script template', function(done) {
        var templatePath = path.resolve(
          __dirname,
          '../../../lib/shiva/scripts/aws-instance-user-data.sh'
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
        expect(aws.createInstances(cluster).then).to.be.a.function();
        done();
      });

      it('should set the correct `UserData` param', function(done) {
        aws.createInstances(cluster).then(function (instances) {
          var params = aws.ec2.runInstances.firstCall.args[0];
          expect(aws.getUserDataScript.calledOnce).to.be.true();
          expect(params.UserData).to.equal(new Buffer(
            aws.getUserDataScript()
          ).toString('base64'));
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

      it('should use the given parameters', function(done) {
        var params = { InstanceType: 'bogus-instance-type' };
        aws.createInstances(cluster, params)
          .then(function () {
            expect(aws.ec2.runInstances.firstCall.args[0].InstanceType)
              .to.equal(params.InstanceType);
            done();
          })
          .catch(done);
      });
    }); // end 'createInstances'

    describe('getUserDataScript', function() {
      var cluster = { id: 'cluster-id', github_id: '234222' };

      beforeEach(function (done) {
        sinon.spy(Mustache, 'render');
        done();
      });

      afterEach(function (done) {
        Mustache.render.restore();
        done();
      });

      it('should render the correct template', function(done) {
        aws.getUserDataScript();
        expect(Mustache.render.calledWith(aws.userDataTemplate)).to.be.true();
        done();
      });

      it('should return the rendered template', function(done) {
        var result = aws.getUserDataScript();
        expect(result).to.equal(Mustache.render.returnValues[0]);
        done();
      });

      it('should set the correct consul_hostname', function(done) {
        var variableName = 'consul_hostname';
        var expectedVariable = process.env.CONSUL_HOSTNAME;
        aws.getUserDataScript();
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

      it('should correctly call ec2 `createTags`', function(done) {
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

    describe('describeInstances', function() {
      it('should return a promise', function(done) {
        expect(aws.describeInstances({}).then).to.be.a.function();
        done();
      });

      it('should correctly call ec2 `describeInstances`', function(done) {
        var params = { neat: 'sweet' };
        aws.describeInstances(params)
          .then(function () {
            expect(aws.ec2.describeInstances.calledOnce).to.be.true();
            expect(aws.ec2.describeInstances.calledWith(params)).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should handle success responses', function(done) {
        aws.describeInstances({})
          .then(function (data) {
            expect(data).to.deep.equal(describeInstancesResponse);
            done();
          })
          .catch(done);
      });

      it('should handle error responses', function(done) {
        var ec2Error = new Error('We only accept lambda functions');
        aws.ec2.describeInstances.yieldsAsync(ec2Error);
        aws.describeInstances({}).asCallback(function (err) {
          expect(err).to.equal(ec2Error);
          done();
        });
      });
    }); // end 'describeInstances'

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
        var value = 1;
        var params = aws.getDefaultInstanceParams();
        expect(params[key]).to.equal(value);
        done();
      });

      it('should set the correct `MaxCount`', function(done) {
        var key = 'MaxCount';
        var value = 1;
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
        var values = ['sg-78b0011c', 'sg-a0b91fc4'];
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

      it('should set the BlockDeviceMappings to an empty array', function(done) {
        var params = aws.getDefaultInstanceParams();
        var mappings = params.BlockDeviceMappings;
        expect(mappings).to.be.an.array();
        expect(mappings.length).to.equal(0);
        done();
      });
    }); // end 'getDefaultInstanceParams'
  }); // end 'aws'
}); // end 'shiva'
