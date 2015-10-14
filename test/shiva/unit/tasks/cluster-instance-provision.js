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

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;
var aws = require('aws');
var Cluster = require('models/cluster');
var clusterInstanceProvision = require('tasks/cluster-instance-provision');
var server = require('server').getInstance();;

describe('tasks', function() {
  describe('cluster-instance-provision', function() {
    var instanceIds = [1];
    var instances = instanceIds.map(function (id) {
      return {
        InstanceId: id,
        State: {
          Name: 'pending'
        }
      };
    });
    var mockCluster = {
      id: 'some-id',
      githubId: 'some-github-id',
      deprovisioning: false
    };

    beforeEach(function (done) {
      sinon.stub(aws, 'createInstances').returns(Promise.resolve(instances));
      sinon.stub(Cluster, 'getByGithubId')
        .returns(Promise.resolve(mockCluster));
      sinon.stub(Cluster, 'githubOrgExists').returns(Promise.resolve(true));
      sinon.stub(server.hermes, 'publish');
      done();
    });

    afterEach(function (done) {
      aws.createInstances.restore();
      server.hermes.publish.restore();
      Cluster.getByGithubId.restore();
      Cluster.githubOrgExists.restore();
      done();
    });

    it('should fatally reject if not given a job', function(done) {
      clusterInstanceProvision().asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/non-object job/);
        done();
      });
    });

    it('should fatally reject without a string `githubId`', function(done) {
      var job = { role: 'dock' };
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/githubId.*string/);
        done();
      });
    });

    it('should fatally reject with non-string `instanceType`', function(done) {
      var job = {
        githubId: 'githurrbs',
        instanceType: ['foop']
      };
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/non-string.*instanceType/i);
        done();
      });
    });

    it('should fatally reject if the cluster does not exist', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      Cluster.githubOrgExists.returns(Promise.resolve(false));
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/unable to find cluster/i);
        done();
      });
    });

    it('should fatally reject if the cluster is deprovisioning', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      Cluster.getByGithubId.returns(Promise.resolve({
        id: 'some-id',
        githubId: 'some-github-id',
        deprovisioning: true
      }));
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/deprovisioning cluster/i);
        done();
      });
    });

    it('should set the aws `InstanceType` parameter', function(done) {
      var job = {
        githubId: 'poofkkfll',
        instanceType: 'c3.2xlarge'
      };
      clusterInstanceProvision(job)
        .then(function() {
          expect(aws.createInstances.calledOnce).to.be.true();
          expect(aws.createInstances.firstCall.args[1]).to.deep.equal({
            InstanceType: job.instanceType
          });
          done();
        })
        .catch(done);
    });

    it('should reject if AWS returns no instances', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      aws.createInstances.returns(Promise.resolve([]));
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskError);
        expect(err.message).to.match(/valid instances/i);
        done();
      });
    });

    it('should publish `cluster-instance-wait` on success', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      clusterInstanceProvision(job).then(function () {
        expect(server.hermes.publish.calledWith('cluster-instance-wait')).to.be.true();
        expect(server.hermes.publish.firstCall.args[1]).to.deep.equal({
          cluster: mockCluster,
          role: job.role,
          instance: instances[0]
        });
        done();
      }).catch(done);
    });

    it('should publish `cluster-instance-tag` on success', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      clusterInstanceProvision(job).then(function () {
        expect(server.hermes.publish.calledWith('cluster-instance-tag')).to.be.true();
        expect(server.hermes.publish.secondCall.args[1]).to.deep.equal({
          org: job.githubId,
          role: job.role,
          instanceId: instanceIds[0]
        });
        done();
      }).catch(done);
    });

    it('should fatally reject if the instance is not pending', function(done) {
      var job = {
        githubId: 'some-id',
        role: 'dock'
      };
      aws.createInstances.returns(Promise.resolve([{
        InstanceId: 'i-someinstance',
        State: {
          Name: 'terminated'
        }
      }]));
      clusterInstanceProvision(job).asCallback(function (err) {
        expect(err).to.be.an.instanceof(TaskFatalError);
        expect(err.message).to.match(/pending state/i);
        done();
      });
    });
  }); // end 'cluster-instance-provision'
}); // end 'tasks'
