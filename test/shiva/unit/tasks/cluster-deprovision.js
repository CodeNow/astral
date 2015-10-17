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
var server = require(process.env.ASTRAL_ROOT + 'shiva/server');
var clusterDeprovision = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-deprovision');

describe('shiva', function() {
  describe('tasks', function() {
    describe('cluster-deprovision', function() {
      var mockCluster = {
        id: '12324-fsx-2244',
        deprovisioning: false
      };
      var mockInstances = [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' }
      ];

      beforeEach(function (done) {
        sinon.stub(server.hermes, 'publish');
        sinon.stub(Cluster, 'getByGithubId')
          .returns(Promise.resolve(mockCluster));
        sinon.stub(Cluster, 'getInstances')
          .returns(Promise.resolve(mockInstances));
        sinon.stub(Cluster, 'setDeprovisioning')
          .returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        server.hermes.publish.restore();
        Cluster.getByGithubId.restore();
        Cluster.getInstances.restore();
        Cluster.setDeprovisioning.restore();
        done();
      });

      it('should fatally reject if not given a job', function(done) {
        clusterDeprovision().asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject without a scalar `githubId`', function(done) {
        clusterDeprovision({ githubId: [12] }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/githubId.*is not/);
          done();
        });
      });

      it('should resolve with a numeric `githubId`', function(done) {
        var job = { githubId: 12324 };
        clusterDeprovision(job).asCallback(done);
      });

      it('should resolve with a string `githubId`', function(done) {
        var job = { githubId: '12324' };
        clusterDeprovision(job).asCallback(done);
      });

      it('should lookup the cluster by githubId', function(done) {
        var job = { githubId: '12324' };
        clusterDeprovision(job)
          .then(function () {
            expect(Cluster.getByGithubId.calledOnce).to.be.true();
            expect(Cluster.getByGithubId.calledWith(job.githubId)).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should fatally reject if no cluster exists', function(done) {
        Cluster.getByGithubId.returns(Promise.resolve(null));
        clusterDeprovision({ githubId: '12' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/No cluster exists/);
          done();
        });
      });

      it('should fatally reject if the cluster is already deprovisioning', function(done) {
        Cluster.getByGithubId.returns(Promise.resolve({
          id: '12324-fsx-2244',
          deprovisioning: true
        }));
        clusterDeprovision({ githubId: 'aabbdddxx' }).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/already.*deprovisioned/);
          done();
        });
      });

      it('should set the cluster as deprovisioning', function(done) {
        var job = { githubId: '12z324' };
        clusterDeprovision(job)
          .then(function () {
            expect(Cluster.setDeprovisioning.calledOnce).to.be.true();
            expect(Cluster.setDeprovisioning.calledWith(mockCluster.id))
              .to.be.true();
            done();
          })
          .catch(done);
      });

      it('should find all instances for the cluster', function(done) {
        var job = { githubId: '12324' };
        clusterDeprovision(job)
          .then(function () {
            expect(Cluster.getInstances.calledOnce).to.be.true();
            expect(Cluster.getInstances.calledWith(mockCluster.id)).to.be.true();
            done();
          })
          .catch(done);
      });

      it('should publish `cluster-instance-terminate` for each cluster instance', function(done) {
        var job = { githubId: '12324' };
        clusterDeprovision(job)
          .then(function () {
            for (var i = 0; i < 3; i++) {
              expect(server.hermes.publish.getCall(i).args[0])
                .to.equal('cluster-instance-terminate');
              expect(server.hermes.publish.getCall(i).args[1])
                .to.deep.equal({ instanceId: mockInstances[i].id })
            }
            done();
          })
          .catch(done);
      });

      it('should publish `cluster-delete`', function(done) {
        var job = { githubId: '12324' };
        clusterDeprovision(job)
          .then(function () {
            expect(server.hermes.publish.lastCall.args[0])
              .to.equal('cluster-delete');
            expect(server.hermes.publish.lastCall.args[1])
              .to.deep.equal({ clusterId: mockCluster.id });
            done();
          })
          .catch(done);
      });
    }); // end 'cluster-deprovision'
  }); // end 'tasks'
}); // end 'shiva'
