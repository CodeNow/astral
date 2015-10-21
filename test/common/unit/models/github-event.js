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

require('loadenv')({ debugName: 'astral:test' });

var githubWebhooks = require('github-webhook-fixtures');

var Util = astralRequire('common/models/util');
var GitHubEvent = astralRequire('common/models/github-event');
var AstralRedis = astralRequire('common/models/astral-redis');
var AstralGitHub = astralRequire('common/models/astral-github');
var NoGithubOrgError = astralRequire('common/errors/no-github-org-error');

describe('common', function() {
  describe('models', function() {
    describe('GitHubEvent', function() {
      describe('_getSelectQueryBuilder', function() {
        it('should return the knex SELECT query builder `github_events`', function(done) {
          var qb = GitHubEvent._getSelectQueryBuilder();
          expect(qb._single).to.be.an.object();
          expect(qb._single.table).to.equal('github_events');
          done();
        });
      }); // end '_getTable'

      describe('_githubURLFilter', function() {
        it('should filter keys that end in `_url`', function(done) {
          expect(GitHubEvent._githubURLFilter('whatever_url')).to.be.false();
          done();
        });

        it('should not filter keys that do not end in `_url`', function(done) {
          expect(GitHubEvent._githubURLFilter('url_totes_ok')).to.be.true();
          done();
        });
      }); // end '_githubURLFilter'

      describe('_filterPayloadFields', function() {
        it('should apply the filter function recursively on all fields', function(done) {
          var filterFn = sinon.spy(function () { return true; });
          GitHubEvent._filterPayloadFields({
            foo: 'bar',
            baz: {
              bam: 'boozle'
            }
          }, filterFn);
          expect(filterFn.callCount).to.equal(3);
          expect(filterFn.calledWith('foo', 'bar')).to.be.true();
          expect(filterFn.calledWith('baz')).to.be.true();
          expect(filterFn.calledWith('bam', 'boozle')).to.be.true();
          done();
        });

        it('should remove fields that do not pass the filter', function(done) {
          var filterFn = function (key, value) {
            return key.charAt(0) !== 'a' && value != 5;
          }
          var given = {
            apples: 2,
            oranges: 3,
            pears: 5,
            awesome: { neat: ['wow'] }
          };
          expect(GitHubEvent._filterPayloadFields(given, filterFn))
            .to.deep.equal({ oranges: 3 });
          done();
        });
      }); // end '_filterPayloadFields'

      describe('_getGitHubOrgFromPayload', function() {
        var redisGetId = 12345689;
        var redisSetId = 72837882;
        var githubOrgResponse = { id: 3484848 };

        beforeEach(function (done) {
          sinon.stub(AstralRedis, 'getGitHubOrgId')
            .returns(Promise.resolve(redisGetId));
          sinon.stub(AstralRedis, 'setGitHubOrgId')
            .returns(Promise.resolve(redisSetId));
          sinon.stub(AstralGitHub, 'showAsync')
            .returns(Promise.resolve(githubOrgResponse));
          done();
        });

        afterEach(function (done) {
          AstralRedis.getGitHubOrgId.restore();
          AstralRedis.setGitHubOrgId.restore();
          AstralGitHub.showAsync.restore();
          done();
        });

        describe('with `membership` payload', function() {
          it('should yield the correct org id', function(done) {
            var payload = githubWebhooks.membership.body;
            var expectedId = payload.organization.id;
            GitHubEvent._getGitHubOrgFromPayload(payload)
              .then(function (id) {
                expect(id).to.equal(expectedId);
                done();
              })
              .catch(done);
          });
        });

        describe('without payload owner name', function() {
          it('should throw NoGithubOrgError', function(done) {
            var payload = {};
            GitHubEvent._getGitHubOrgFromPayload(payload)
              .asCallback(function (err) {
                expect(err).to.exist();
                expect(err).to.be.an.instanceof(NoGithubOrgError);
                done();
              });
          });
        });

        describe('with payload owner name', function() {
          it('should fetch the id from the redis cache', function(done) {
            var payload = githubWebhooks.status.body;
            var name = payload.repository.owner.login;
            GitHubEvent._getGitHubOrgFromPayload(payload)
              .then(function () {
                expect(AstralRedis.getGitHubOrgId.calledWith(name))
                .to.be.true();
                done();
              })
              .catch(done);
          });

          it('should yield a cached id', function(done) {
            var payload = githubWebhooks.status.body;
            GitHubEvent._getGitHubOrgFromPayload(payload)
              .then(function (id) {
                expect(id).to.equal(redisGetId);
                done();
              })
              .catch(done);
          });

          describe('and without cached id', function () {
            beforeEach(function (done) {
              AstralRedis.getGitHubOrgId.returns(Promise.resolve(null));
              done();
            });

            it('should set and yield the id from `repository.owner.id`', function(done) {
              var payload = githubWebhooks.status.body;
              var id = payload.repository.owner.id;
              var name = payload.repository.owner.login;
              GitHubEvent._getGitHubOrgFromPayload(payload)
                .then(function (resultId) {
                  expect(AstralRedis.setGitHubOrgId.calledWith(name, id))
                    .to.be.true();
                  expect(resultId).to.equal(redisSetId);
                  done();
                });
            });

            it('should fetch, set, and yield the id from GitHub API', function(done) {
              var payload = githubWebhooks.push.body;
              var name = payload.repository.owner.name;
              var responseId = githubOrgResponse.id;
              GitHubEvent._getGitHubOrgFromPayload(payload)
                .then(function (id) {
                  expect(AstralGitHub.showAsync.calledWith(name)).to.be.true();
                  expect(AstralRedis.setGitHubOrgId.calledWith(name, responseId))
                    .to.be.true();
                  expect(id).to.equal(redisSetId);
                  done();
                })
            });
          });
        });
      }); // end '_getGitHubOrgFromPayload'

      describe('insert', function() {
        var row;
        var queryBuilder = GitHubEvent._getSelectQueryBuilder();
        var defaultOrgId = 12340909;

        beforeEach(function (done) {
          row = {
            delivery_id: 'some-delivery-id',
            type: 'push',
            payload: { repository: { neat: 'wow' } },
            recorded_at: parseInt(new Date().getTime() / 1000)
          };
          sinon.stub(queryBuilder, 'insert').returns(Promise.resolve());
          sinon.stub(GitHubEvent, '_filterPayloadFields').returns(row.payload);
          sinon.stub(GitHubEvent, '_getGitHubOrgFromPayload')
            .returns(Promise.resolve(defaultOrgId));
          done();
        });

        afterEach(function (done) {
          queryBuilder.insert.restore();
          GitHubEvent._filterPayloadFields.restore();
          GitHubEvent._getGitHubOrgFromPayload.restore();
          done();
        });

        it('should filter the payload', function(done) {
          GitHubEvent.insert(row)
            .then(function () {
              expect(GitHubEvent._filterPayloadFields.calledWith(row.payload))
                .to.be.true();
              done();
            })
            .catch(done);
        });

        it('should get the org id from the payload', function(done) {
          GitHubEvent.insert(row)
            .then(function () {
              expect(
                GitHubEvent._getGitHubOrgFromPayload.calledWith(row.payload)
              ).to.be.true();
              done();
            })
            .catch(done);
        });

        it('should insert the row into the table', function(done) {
          GitHubEvent.insert(row)
            .then(function () {
              expect(queryBuilder.insert.calledOnce).to.be.true();
              expect(queryBuilder.insert.firstCall.args[0]).to.deep.equal({
                delivery_id: row.delivery_id,
                type: row.type,
                payload: JSON.stringify(row.payload),
                recorded_at: new Date(row.recorded_at * 1000),
                github_org_id: defaultOrgId
              });
              done();
            })
            .catch(done);
        });
      }); // end 'insert'
    });
  }); // end 'models'
}); // end 'common'
