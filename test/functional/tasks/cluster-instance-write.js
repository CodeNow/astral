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

require('loadenv')('shiva:test');

var db = require('database');
var dbFixture = require('../../fixtures/database.js');
var clusterInstanceWrite = require('tasks/cluster-instance-write');

describe('functional', function() {
  describe('tasks', function() {
    describe('cluster-instance-write', function() {
      beforeEach(dbFixture.truncate);
      beforeEach(function (done) {
        dbFixture.createCluster('1').asCallback(done)
      });

      it('should write a run instance to the database', function(done) {
        var job = {
          cluster: { id: '1' },
          type: 'run',
          instances: [
            {
              InstanceId: '1234',
              ImageId: 'ami-13203',
              InstanceType: 't1.micro'
            }
          ]
        };
        clusterInstanceWrite(job)
          .then(function () {
            return db.select().from('instances');
          })
          .then(function (rows) {
            expect(rows.length).to.equal(1);
            expect(rows[0].id).to.equal(job.instances[0].InstanceId);
            expect(rows[0].cluster_id).to.equal(job.cluster.id);
            expect(rows[0].type).to.equal(job.type);
            expect(rows[0].ami_id).to.equal(job.instances[0].ImageId);
            expect(rows[0].aws_type).to.equal(job.instances[0].InstanceType);
            done();
          })
          .catch(done);
      });

      it('should write a build instance to the database', function(done) {
        var job = {
          cluster: { id: '1' },
          type: 'build',
          instances: [
            {
              InstanceId: 'apppplless',
              ImageId: 'amsss;;;zzi-13203',
              InstanceType: 't3.super'
            }
          ]
        };
        clusterInstanceWrite(job)
          .then(function () {
            return db.select().from('instances');
          })
          .then(function (rows) {
            expect(rows.length).to.equal(1);
            expect(rows[0].id).to.equal(job.instances[0].InstanceId);
            expect(rows[0].cluster_id).to.equal(job.cluster.id);
            expect(rows[0].type).to.equal(job.type);
            expect(rows[0].ami_id).to.equal(job.instances[0].ImageId);
            expect(rows[0].aws_type).to.equal(job.instances[0].InstanceType);
            done();
          })
          .catch(done);
      });

      it('should write many instances to the database', function(done) {
        var job = {
          cluster: { id: '1' },
          type: 'build',
          instances: [
            {
              InstanceId: 'alpha',
              ImageId: '1',
              InstanceType: 't1.micro'
            },
            {
              InstanceId: 'beta',
              ImageId: '2',
              InstanceType: 't2.micro'
            }
          ]
        };
        clusterInstanceWrite(job)
          .then(function () {
            return db.select().from('instances').orderBy('id', 'asc');
          })
          .then(function (rows) {
            rows.forEach(function (row, index) {
              expect(row.id).to.equal(job.instances[index].InstanceId);
              expect(row.cluster_id).to.equal(job.cluster.id);
              expect(row.type).to.equal(job.type);
              expect(row.ami_id).to.equal(job.instances[index].ImageId);
              expect(row.aws_type).to.equal(job.instances[index].InstanceType);
            });
            done();
          })
          .catch(done);
      });
    }); // end 'cluster-instance-write'
  }); // end 'tasks'
}); // end 'functional'
