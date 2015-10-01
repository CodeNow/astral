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

var instance = require('models/instance');
var db = require('database');
var dbFixture = require('../../fixtures/database.js');

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
          aws_instance_type: 'large',
          aws_private_ip_address: '127.0.0.1'
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
    }); // end 'Instance'
  }); // end 'models'
}); // end 'functional'
