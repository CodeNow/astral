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

var Promise = require('bluebird');
var TaskError = require('ponos').TaskError;
var TaskFatalError = require('ponos').TaskFatalError;

var Cluster = require(process.env.ASTRAL_ROOT + 'shiva/models/cluster');
var clusterProvision = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-provision');
var server = require(process.env.ASTRAL_ROOT + 'shiva/server');

describe('shiva', function() {
  describe('tasks', function() {
    describe('cluster-provision', function() {
      beforeEach(function (done) {
        sinon.stub(Cluster, 'githubOrgExists').returns(Promise.resolve(false));
        sinon.stub(Cluster, 'insert').returns(Promise.resolve());
        sinon.stub(server.hermes, 'publish');
        done();
      });

      afterEach(function (done) {
        Cluster.githubOrgExists.restore();
        Cluster.insert.restore();
        server.hermes.publish.restore();
        done();
      });

      it('should fatally reject if not given a job', function(done) {
        clusterProvision().asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject without job `githubId`', function(done) {
        clusterProvision({ bitbucket_id: 'no' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/missing.*githubId/);
          done();
        });
      });

      it('should fatally reject if the `githubId` is not an integer nor a string', function(done) {
        clusterProvision({ githubId: {} }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/missing.*githubId/);
          done();
        })
      });

      it('should check to see if a cluster already exists', function(done) {
        var githubId = '1234';
        Cluster.githubOrgExists.returns(Promise.resolve(true));
        clusterProvision({ githubId: githubId }).then(function () {
          expect(Cluster.githubOrgExists.calledWith(githubId)).to.be.true();
          done();
        }).catch(done);
      });

      it('should stop if the cluster already exists', function(done) {
        Cluster.githubOrgExists.returns(Promise.resolve(true));
        clusterProvision({ githubId: '22' }).then(function () {
          expect(Cluster.insert.callCount).to.equal(0);
          done();
        }).catch(done);
      });

      it('should insert the cluster into the database', function(done) {
        var githubId = '2345';
        clusterProvision({ githubId: githubId }).then(function () {
          expect(Cluster.insert.calledOnce).to.be.true();
          expect(Cluster.insert.firstCall.args[0]).to.deep.equal({
            'github_id': githubId
          });
          done();
        }).catch(done);
      });

      it('should publish messages to provision dock instances', function(done) {
        var githubId = '5995992';
        clusterProvision({ githubId: githubId }).then(function (cluster) {
          expect(server.hermes.publish.callCount)
            .to.equal(process.env.CLUSTER_INITIAL_DOCKS);
          for (var i = 0; i < process.env.CLUSTER_INITIAL_DOCKS; i++) {
            expect(server.hermes.publish.getCall(i).args[0])
              .to.equal('cluster-instance-provision');
            expect(server.hermes.publish.getCall(i).args[1]).to.deep.equal({
              githubId: githubId
            });
          }
          done();
        }).catch(done);
      });

      it('should cast a given integer githubId to a string', function(done) {
        var githubId = 1234;
        clusterProvision({ githubId: githubId }).then(function (cluster) {
          expect(server.hermes.publish.callCount)
            .to.equal(process.env.CLUSTER_INITIAL_DOCKS);
          for (var i = 0; i < process.env.CLUSTER_INITIAL_DOCKS; i++) {
            expect(server.hermes.publish.getCall(i).args[0])
              .to.equal('cluster-instance-provision');
            expect(server.hermes.publish.getCall(i).args[1]).to.deep.equal({
              githubId: githubId.toString()
            });
          }
          done();
        }).catch(done);
      });
    }); // end 'cluster-provision'
  }); // end 'tasks'
}); // end 'shiva'
