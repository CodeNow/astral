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

var instance = require(process.env.ASTRAL_ROOT + 'shiva/models/instance');
var cluster = require(process.env.ASTRAL_ROOT + 'shiva/models/cluster');
var db = require(process.env.ASTRAL_ROOT + 'common/database');
var dbFixture = require(process.env.ASTRAL_ROOT + '../test/fixtures/database.js');

describe('shiva', function() {
  describe('functional', function() {
    describe('models', function() {
      describe('Instance', function() {
        beforeEach(dbFixture.truncate);
        beforeEach(function (done) {
          dbFixture.createCluster('1')
            .then(function () {
              return dbFixture.createInstance('1', '1');
            })
            .asCallback(done);
        });

        it('should require a valid cluster_id', function(done) {
          var invalidRow = {
            id: 'some-instance-id',
            cluster_id: 'not-there',
            role: 'build',
            aws_image_id: 'some-ami-id',
            aws_instance_type: 't2.micro',
            aws_private_ip_address: '10.20.0.0'
          };
          instance.create(invalidRow).asCallback(function(err) {
            expect(err).to.exist();
            var expectedMsg = 'insert into "instances" ';
            expectedMsg += '("aws_image_id", "aws_instance_type", "aws_private_ip_address", "cluster_id", "id", "role")';
            expectedMsg += ' values ($1, $2, $3, $4, $5, $6)';
            expectedMsg += ' - insert or update on table "instances" violates foreign key constraint "instances_to_clusters"'
            expect(err.message).to.equal(expectedMsg);
            done();
          });
        });

        describe('create and softDelete', function () {
          var ctx = {
            instanceId: 3,
            clusterId: 100,
          };
          beforeEach(function(done) {
            var clusterData = {
              id: ctx.clusterId,
              github_id: 20123
            };
            var instanceData = {
              id: ctx.instanceId,
              cluster_id: ctx.clusterId,
              role: 'build',
              aws_image_id: 'some-ami-id',
              aws_instance_type: 't2.micro',
              aws_private_ip_address: '10.20.0.0'
            };
            cluster.create(clusterData).then(
              function () {
                return instance.create(instanceData).asCallback(done);
              });
          });
          afterEach(function(done) {
            instance.del().asCallback(done);
          });
          afterEach(function(done) {
            cluster.del().asCallback(done);
          });
          it('should softDelete instance successfully', function(done) {
            instance.get(ctx.instanceId).asCallback(function (err, initialRow) {
              expect(err).to.be.null();
              expect(initialRow.deleted).to.be.null();
              instance.softDelete(ctx.instanceId).asCallback(function (err, deleted) {
                expect(err).to.be.null();
                expect(deleted).to.equal(1);
                instance.get(ctx.instanceId).asCallback(function (err, finalRow) {
                  expect(err).to.be.null();
                  expect(finalRow.deleted).to.exist();
                  done();
                });
              });
            });
          });

          describe('soft delete softDeleted row', function() {
            beforeEach(function(done) {
              ctx.instanceId = 4;
              var instanceData = {
                id: ctx.instanceId,
                cluster_id: ctx.clusterId,
                role: 'build',
                aws_image_id: 'some-ami-id',
                aws_instance_type: 't2.micro',
                aws_private_ip_address: '10.20.0.0',
                deleted: 'now'
              };
              return instance.create(instanceData).asCallback(done);
            });

            it('should not softDelete instance if it was already softDeleted', function(done) {
              instance.get(ctx.instanceId).asCallback(function (err, initialRow) {
                expect(err).to.be.null();
                var originalDeleted = initialRow.deleted;
                expect(initialRow.deleted).to.exist();
                instance.softDelete(ctx.instanceId).asCallback(function (err, deleted) {
                  expect(err).to.be.null();
                  expect(deleted).to.equal(0);
                  instance.get(ctx.instanceId).asCallback(function (err, finalRow) {
                    expect(err).to.be.null();
                    expect(finalRow.deleted).to.exist();
                    expect(originalDeleted.toString()).to.equal(finalRow.deleted.toString());
                    done();
                  });
                });
              });
            });
          });
        }); // end 'create and soft delete'
      }); // end 'Instance'
    }); // end 'models'
  }); // end 'functional'
}); // end 'shiva'
