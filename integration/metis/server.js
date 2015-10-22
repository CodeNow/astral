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

require('loadenv')({ project: 'metis', debugName: 'astral:metis:test' });
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require');
var dbFixture = require('../../test/fixtures/database.js');
var githubWebhooks = require('github-webhook-fixtures');

var server = astralRequire('metis/server');
var AstralRedis = astralRequire('common/models/astral-redis');
var db = astralRequire('common/database');

describe('metis', function() {
  describe('integration', function() {
    describe('server', function() {
      before(dbFixture.terminateInstances);
      before(dbFixture.truncate);
      before(function (done) {
        AstralRedis.getClient().del(
          process.env.REDIS_GITHUB_OWNER_ID_HASH,
          done
        );
      });
      before(function (done) { server.start().asCallback(done); });
      after(function (done) { server.stop().asCallback(done); });

      it('should insert the webhook event into the database', function(done) {
        // Create and publish the job
        var webhook = githubWebhooks.push;
        var job = {
          deliveryId: webhook.headers['X-Github-Delivery'],
          eventType: 'push',
          recordedAt: parseInt(new Date().getTime() / 1000),
          payload: webhook.body
        };
        server.hermes.publish('metis-github-event', job);

        var checkInterval = setInterval(function () {
          db.select()
            .from('github_events')
            .where({ delivery_id: job.deliveryId })
            .limit(1)
            .then(function (rows) {
              if (rows.length !== 1) {
                return;
              }
              var row = rows[0];
              expect(row.delivery_id).to.equal(job.deliveryId);
              expect(row.type).to.equal(job.eventType);
              expect(parseInt(row.recorded_at.getTime() / 1000))
                .to.equal(job.recordedAt);
              expect(row.payload).to.deep.equal(job.payload);
              // baxterthehacker github id from fixtures
              expect(row.github_org_id).to.equal('6752317');
              clearInterval(checkInterval);
              done();
            })
            .catch(function (err) {
              clearInterval(checkInterval);
              done(err);
            });
        }, 500);
      });
    }); // end 'server'
  }); // end 'integration'
}); // end 'metis'
