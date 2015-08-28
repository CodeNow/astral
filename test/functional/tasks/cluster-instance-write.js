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

      it('should write a dock instance to the database', function(done) {
        var job = {
          cluster: { id: '1' },
          role: 'dock',
          instances: [
            {
              InstanceId: '1234',
              ImageId: 'ami-13203',
              InstanceType: 't1.micro',
              PrivateIpAddress: '10.20.0.0'
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
            expect(rows[0].aws_image_id).to.equal(job.instances[0].ImageId);
            expect(rows[0].aws_instance_type)
              .to.equal(job.instances[0].InstanceType);
            expect(rows[0].aws_private_ip_address)
              .to.equal(job.instances[0].PrivateIpAddress);
            done();
          })
          .catch(done);
      });

      it('should write many instances to the database', function(done) {
        var job = {
          cluster: { id: '1' },
          role: 'dock',
          instances: [
            {
              InstanceId: 'alpha',
              ImageId: '1',
              InstanceType: 't1.micro',
              PrivateIpAddress: '10.20.0.0'
            },
            {
              InstanceId: 'beta',
              ImageId: '2',
              InstanceType: 't2.micro',
              PrivateIpAddress: '10.20.0.1'
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
              expect(row.role).to.equal(job.role);
              expect(row.aws_image_id).to.equal(job.instances[index].ImageId);
              expect(row.aws_instance_type)
                .to.equal(job.instances[index].InstanceType);
              expect(row.aws_private_ip_address)
                .to.equal(job.instances[index].PrivateIpAddress);
            });
            done();
          })
          .catch(done);
      });
    }); // end 'cluster-instance-write'
  }); // end 'tasks'
}); // end 'functional'
