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

var Instance = require(process.env.ASTRAL_ROOT + 'shiva/models/instance');
var clusterInstanceWrite = require(process.env.ASTRAL_ROOT + 'shiva/tasks/cluster-instance-write');

describe('shiva', function() {
  describe('tasks', function() {
    describe('cluster-instance-write', function() {
      var job = {
        cluster: { id: '123' },
        role: 'dock',
        instance: {
          InstanceId: '1234',
          ImageId: '123454',
          InstanceType: 't1.micro',
          PrivateIpAddress: '10.20.0.0'
        }
      };

      var instanceRow = {
        id: job.instance.InstanceId,
        cluster_id: job.cluster.id,
        role: job.role,
        aws_image_id: job.instance.ImageId,
        aws_instance_type: job.instance.InstanceType,
        aws_private_ip_address: job.instance.PrivateIpAddress
      };

      beforeEach(function (done) {
        sinon.stub(Instance, 'insert').returns(Promise.resolve());
        sinon.stub(Instance, 'exists').returns(Promise.resolve(false));
        done();
      });

      afterEach(function (done) {
        Instance.insert.restore();
        Instance.exists.restore();
        done();
      });

      it('should return a promise', function(done) {
        expect(clusterInstanceWrite(job).then).to.be.a.function();
        done();
      });

      it('should fatally reject if not given a job', function(done) {
        clusterInstanceWrite().asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject with a non-object `cluster`', function(done) {
        var job = { cluster: 42 };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/cluster.*object/);
          done();
        });
      });

      it('should fatally reject without `cluster.id`', function(done) {
        var job = { cluster: {} };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/cluster\.id.*string/);
          done();
        });
      });

      it('should fatally reject with a non-string `role`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: { foo: 'bar' }
        };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/role.*string/);
          done();
        });
      });

      it('should fatally reject with a non-object `instance`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: 890123
        };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/instance.*object/);
          done();
        });
      });

      it('should fatally reject given an instance with a non-string `InstanceId`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: { InstanceId: [1, 1, 2, 3, 5, 8, 13] }
        };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/InstanceId.*string/);
          done();
        });
      });

      it('should fatally reject given an instance with a non-string `ImageId`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: { InstanceId: '4582', ImageId: [1, 2, 4, 8] }
        };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/ImageId.*string/);
          done();
        });
      });

      it('should fatally reject given an instance with a non-string `InstanceType`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: {
            InstanceId: '4582',
            ImageId: '728392',
            InstanceType: { foo: 'bar'}
          }
        };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/InstanceType.*string/);
          done();
        });
      });

      it('should fatally reject given an instance with a non-string `PrivateIpAddress`', function(done) {
        var job = {
          cluster: { id: '123' },
          role: 'dock',
          instance: {
            InstanceId: '4582',
            ImageId: '728392',
            InstanceType: 'wow',
            PrivateIpAddress: [23, 42]
          }
        };
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/PrivateIpAddress.*string/);
          done();
        });
      });

      it('should resolve with correct parameters', function(done) {
        clusterInstanceWrite(job).asCallback(done);
      });

      it('should check to see if the instance exists', function(done) {
        clusterInstanceWrite(job).then(function () {
          expect(Instance.exists.calledOnce).to.be.true();
          expect(Instance.exists.firstCall.args[0]).to.deep.equal(instanceRow.id);
          done();
        }).catch(done);
      });

      it('should fatally reject if the instance exists', function(done) {
        Instance.exists.returns(Promise.resolve(true));
        clusterInstanceWrite(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/id.*exists/);
          done();
        });
      });

      it('should insert the instances into the database', function(done) {
        clusterInstanceWrite(job).then(function () {
          expect(Instance.insert.calledOnce).to.be.true();
          expect(Instance.insert.firstCall.args[0]).to.deep.equal(instanceRow);
          done();
        }).catch(done);
      });
    }); // end 'cluster-instance-write'
  }); // end 'tasks'
}); // end 'shiva'
