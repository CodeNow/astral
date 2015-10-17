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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var Promise = require('bluebird');
var uuid = require('uuid');
var noop = require('101/noop');

var Model = require(process.env.ASTRAL_ROOT + 'shiva/models/model');
var cluster = require(process.env.ASTRAL_ROOT + 'shiva/models/cluster');
var instance = require(process.env.ASTRAL_ROOT + 'shiva/models/instance');

describe('shiva', function () {
  describe('models', function () {
    describe('Cluster', function() {
      describe('constructor', function() {
        it('should set the correct table', function(done) {
          expect(cluster.table).to.equal('clusters');
          done();
        });

        it('should set the correct primary key', function(done) {
          expect(cluster.primaryKey).to.equal('id');
          done();
        });
      }); // end 'Cluster'

      describe('getInstances', function() {
        it('should return a promise', function(done) {
          expect(cluster.getInstances('some-id').then).to.be.a.function();
          done();
        });

        it('should use the correct instances select query', function(done) {
          var id = 'this-is-id';
          sinon.stub(instance, 'select').returns({
            where: function (opts) {
              expect(opts.cluster_id).to.equal(id);
              instance.select.restore();
              done();
            }
          });
          cluster.getInstances(id);
        });
      }); // end 'getInstances'

      describe('githubOrgExists', function() {
        var mock = {
          where: function () { return mock; },
          map: function () { return mock; },
          reduce: function () { return mock; }
        };

        beforeEach(function (done) {
          sinon.spy(mock, 'where');
          sinon.spy(mock, 'map');
          sinon.spy(mock, 'reduce');
          sinon.stub(cluster, 'count').returns(mock);
          done();
        });

        afterEach(function (done) {
          mock.where.restore();
          mock.map.restore();
          mock.reduce.restore();
          cluster.count.restore();
          done();
        });

        it('should use the correct query', function(done) {
          var githubId = '1234wow';
          cluster.githubOrgExists(githubId);
          expect(mock.where.firstCall.args[0])
            .to.deep.equal({ 'github_id': githubId });
          done();
        });

        it('should resolve with `false` if the cluster does not exist', function(done) {
          cluster.githubOrgExists('totesnotthere');
          expect(mock.map.calledOnce).to.be.true();
          expect(mock.map.firstCall.args[0]).to.be.a.function();
          var mapFunction = mock.map.firstCall.args[0];
          expect(mapFunction({ count: 0 })).to.deep.equal(false);
          done();
        });

        it('should resolve with `true` if the cluster exists', function(done) {
          cluster.githubOrgExists('1234neat');
          expect(mock.reduce.calledOnce).to.be.true();
          expect(mock.reduce.firstCall.args[0]).to.be.a.function();
          expect(mock.reduce.firstCall.args[1]).to.be.false();
          var reduceFunction = mock.reduce.firstCall.args[0];
          expect(reduceFunction(false, true)).to.equal(true);
          done();
        });
      }); // end 'githubOrgExists'

      describe('getByGithubId', function() {
        var mock = {
          where: function () { return mock; },
          reduce: function () { return mock; }
        };

        beforeEach(function (done) {
          sinon.spy(mock, 'where');
          sinon.spy(mock, 'reduce');
          sinon.stub(cluster, 'select').returns(mock);
          done();
        });

        afterEach(function (done) {
          mock.where.restore();
          mock.reduce.restore();
          cluster.select.restore();
          done();
        });

        it('should use the correct query', function(done) {
          var githubId = 'omgwow';
          cluster.getByGithubId(githubId);
          expect(mock.where.firstCall.args[0])
            .to.deep.equal({ 'github_id': githubId });
          done();
        });

        it('should return the record if it exists', function(done) {
          cluster.getByGithubId('sothere');
          expect(mock.reduce.calledOnce).to.be.true();
          expect(mock.reduce.firstCall.args[0]).to.be.a.function();
          var reduceFunction = mock.reduce.firstCall.args[0];
          var record = { foo: 'bar' };
          expect(reduceFunction(null, record)).to.deep.equal(record);
          done();
        });

        it('should return null if the record does not exist', function(done) {
          cluster.getByGithubId('nowayjose');
          expect(mock.reduce.calledOnce).to.be.true();
          expect(mock.reduce.firstCall.args[0]).to.be.a.function();
          var reduceFunction = mock.reduce.firstCall.args[0];
          expect(reduceFunction(null, null)).to.be.null();
          done();
        });
      }); // end 'getByGithubId'

      describe('insert', function() {
        beforeEach(function (done) {
          sinon.stub(Model.prototype, 'insert');
          sinon.spy(uuid, 'v1');
          done();
        });

        afterEach(function (done) {
          Model.prototype.insert.restore();
          uuid.v1.restore();
          done();
        });

        it('should call Model.prototype.insert', function(done) {
          cluster.insert({ foo: 'bar' });
          expect(Model.prototype.insert.calledOnce).to.be.true();
          done();
        });

        it('should use the given id', function(done) {
          var data = { id: 'some-id' };
          cluster.insert(data);
          expect(Model.prototype.insert.calledWith(data)).to.be.true();
          done();
        });

        it('should generate an id if none was given', function(done) {
          var data = { github_org: 'wow' };
          cluster.insert(data);
          expect(uuid.v1.calledOnce).to.be.true();
          expect(Model.prototype.insert.firstCall.args[0]).to.deep.equal({
            id: uuid.v1.returnValues[0],
            github_org: data.github_org
          });
          done();
        });
      }); // end 'insert'

      describe('setDeprovisioning', function() {
        beforeEach(function (done) {
          sinon.stub(cluster, 'update');
          done();
        });

        afterEach(function (done) {
          cluster.update.restore();
          done();
        });

        it('should call update to set the deprovisioning flag', function(done) {
          var clusterId = '12343';
          cluster.setDeprovisioning(clusterId);
          expect(cluster.update.calledOnce).to.be.true();
          expect(cluster.update.firstCall.args[0]).to.equal(clusterId);
          expect(cluster.update.firstCall.args[1]).to.deep.equal({
            deprovisioning: true
          });
          done();
        });
      }); // end 'setDeprovisioning'

      describe('deleteInstances', function() {
        var queryMock = {
          where: function () { return queryMock; },
          del: function () { return queryMock; }
        };

        beforeEach(function (done) {
          sinon.stub(cluster, 'db').returns(queryMock)
          sinon.spy(queryMock, 'where');
          sinon.spy(queryMock, 'del');
          done();
        });

        afterEach(function (done) {
          cluster.db.restore();
          queryMock.del.restore();
          queryMock.where.restore();
          done();
        });

        it('should delete all instances with the given cluster_id', function(done) {
          var clusterId = 'some-cluster';
          cluster.deleteInstances(clusterId);
          expect(cluster.db.calledWith('instances')).to.be.true();
          expect(queryMock.where.calledOnce).to.be.true();
          expect(queryMock.where.firstCall.args[0]).to.deep.equal({
            'cluster_id': clusterId
          });
          expect(queryMock.del.calledOnce).to.be.true();
          done();
        });
      });
    }); // end 'Cluster'
  }); // end 'models'
}); // end 'shiva'
