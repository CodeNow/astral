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

var Promise = require('bluebird');
var TaskFatalError = require('ponos').TaskFatalError;
var githubWebhooks = require('github-webhook-fixtures');

var metisGithubEvent = astralRequire('metis/tasks/metis-github-event');
var GitHubEvent = astralRequire('common/models/github-event');
var UniqueError = astralRequire('common/errors/unique-error');

describe('metis', function() {
  describe('tasks', function() {
    describe('metis-github-event', function() {
      beforeEach(function (done) {
        sinon.stub(GitHubEvent, 'insert').returns(Promise.resolve());
        done();
      });

      afterEach(function (done) {
        GitHubEvent.insert.restore();
        done();
      });

      it('should fatally reject without a job', function(done) {
        var job = null;
        metisGithubEvent(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/non-object job/);
          done();
        });
      });

      it('should fatally reject without string `deliveryId`', function(done) {
        var job = { deliveryId: [] };
        metisGithubEvent(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/deliveryId.*string/);
          done();
        });
      });

      it('should fatally reject without string `eventType`', function(done) {
        var job = { deliveryId: '' };
        metisGithubEvent(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/eventType.*string/);
          done();
        });
      });

      it('should fatally reject without integer `recordedAt`', function(done) {
        var job = { deliveryId: '', eventType: '' };
        metisGithubEvent(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/recordedAt.*integer/);
          done();
        });
      });

      it('should fatally reject without object `payload`', function(done) {
        var job = { deliveryId: '', eventType: '', recordedAt: 0 };
        metisGithubEvent(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/payload.*object/);
          done();
        });
      });

      it('should insert the row via the GitHubEvent model', function(done) {
        var job = {
          deliveryId: 'some-delivery-id',
          eventType: 'push',
          recordedAt: 9241983,
          payload: githubWebhooks.push.body
        };
        metisGithubEvent(job)
          .then(function () {
            expect(GitHubEvent.insert.calledOnce).to.be.true();
            expect(GitHubEvent.insert.firstCall.args[0]).to.deep.equal({
              delivery_id: job.deliveryId,
              type: job.eventType,
              recorded_at: job.recordedAt,
              payload: job.payload
            });
            done();
          })
          .catch(done);
      });

      it('should fatally reject on a UniqueError', function(done) {
        var job = {
          deliveryId: 'some-delivery-id',
          eventType: 'push',
          recordedAt: 9241983,
          payload: githubWebhooks.push.body
        };
        GitHubEvent.insert.returns(Promise.reject(new UniqueError()));
        metisGithubEvent(job).asCallback(function (err) {
          expect(err).to.be.an.instanceof(TaskFatalError);
          expect(err.message).to.match(/deliveryId.*already.*processed/);
          done();
        });
      });
    }); // end 'metis-github-event'
  }); // end 'tasks'
}); // end 'metis'
