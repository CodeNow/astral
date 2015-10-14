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
var aws = require('aws');

describe('integration', function() {

  describe('providers', function() {
    describe('aws', function() {
      var cluster = {
        id: 'some-id',
        ssh_key_name: process.env.AWS_SSH_KEY_NAME,
        security_group_id: process.env.AWS_CLUSTER_SECURITY_GROUP_ID,
        subnet_id: process.env.AWS_CLUSTER_SUBNET
      };
      var ids = null;

      it('should create instances', function(done) {
        aws.createInstances(cluster)
          .then(function (instances) {
            ids = instances.map(function (instance) {
              expect(instance.InstanceId).to.exist();
              expect(instance.ImageId)
                .to.equal(process.env.AWS_INSTANCE_IMAGE_ID);
              return instance.InstanceId;
            });
            done();
          })
          .catch(done);
      });

      it('should wait for instances to be running', function(done) {
        if (!exists(ids)) {
          done(new Error('AWS integration tests must be run as a suite.'));
        }
        aws.waitFor('instanceRunning', { InstanceIds: ids }).asCallback(done);
      });

      it('should describe instances in a running state', function(done) {
        if (!exists(ids)) {
          done(new Error('AWS integration tests must be run as a suite.'));
        }
        aws.describeInstances({ InstanceIds: ids }).then(function (data) {
          expect(data.Reservations).to.exist();
          data.Reservations.forEach(function (reservation) {
            expect(reservation.Instances).to.exist();
            reservation.Instances.forEach(function (instance) {
              expect(instance.State).to.be.an.object();
              expect(instance.State.Name).to.equal('running');
            });
          });
          done();
        }).catch(done);
      });

      it('should be able to tag instances', function(done) {
        if (!exists(ids)) {
          done(new Error('AWS integration tests must be run as a suite.'));
        }
        aws.createTags({
          Resources: ids,
          Tags: [
            { Key: 'Name', Value: 'shiva-integration-test' }
          ]
        }).asCallback(done);
      });

      it('should terminate instances', function(done) {
        if (!exists(ids)) {
          done(new Error('AWS integration tests must be run as a suite.'));
        }
        aws.terminateInstances({
          InstanceIds: ids
        }).asCallback(done);
      });

      it('should wait for instances to be terminated', function(done) {
        if (!exists(ids)) {
          done(new Error('AWS integration tests must be run as a suite.'));
        }
        aws.waitFor('instanceTerminated', {
          InstanceIds: ids
        }).asCallback(done);
      });
    }); // end 'aws'
  }); // end 'providers'
}); // end 'integration'
