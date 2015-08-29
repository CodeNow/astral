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
          cluster_id: 'not-there',
          type: 'build',
          ami_id: 'some-ami-id',
          ami_version: 'some-ami-version'
        };
        instance.create(invalidRow).asCallback(function (err) {
          expect(err).to.exist();
          done();
        });
      });
    }); // end 'Instance'
  }); // end 'models'
}); // end 'functional'
