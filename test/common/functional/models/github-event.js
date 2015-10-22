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

var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');
var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'metis', debugName: 'astral:metis:test' });

var db = astralRequire('common/database');
var GitHubEvent = astralRequire('common/models/github-event');
var UniqueError = astralRequire('common/errors/unique-error');

var dbFixture = astralRequire('../test/fixtures/database');
var githubWebhooks = require('github-webhook-fixtures');

describe('common', function() {
  describe('functional', function() {
    describe('GitHubEvent', function() {
      beforeEach(dbFixture.truncate);

      describe('insert', function() {
        var row;

        beforeEach(function (done) {
          row = {
            delivery_id: 'delivery-id',
            type: 'push',
            payload: githubWebhooks.push.body,
            recorded_at: parseInt(new Date().getTime() / 1000)
          };

          db('github_events').insert({
            delivery_id: 'delivery-id-taken',
            type: 'push',
            payload: {},
            github_org_id: 230,
            recorded_at: new Date()
          }).asCallback(done);
        });

        it('should write github events to the database', function(done) {
          GitHubEvent.insert(row)
            .then(function () {
              return db.select().from('github_events');
            })
            .then(function (rows) {
              expect(rows.length).to.equal(2);
              expect(rows[1].type).to.equal(row.type);
              expect(rows[1].delivery_id).to.equal(row.delivery_id);
              done();
            })
            .catch(done);
        });

        it('should throw `UniqueError` with an existing delivery_id', function(done) {
          row.delivery_id = 'delivery-id-taken';
          GitHubEvent.insert(row)
            .then(function () {
              done('Did not throw UniqueError')
            })
            .catch(UniqueError, function (err) {
              done();
            })
            .catch(done);
        });
      });
    }); // end 'GitHubEvent'
  }); // end 'functional'
}); // end 'common'
