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
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/common/fixtures/astral-require');

require('loadenv')({ debugName: 'astral:test' });

var Util = astralRequire('common/models/util');
var GitHubEvent = astralRequire('common/models/github-event');

describe('common', function() {
  describe('models', function() {
    describe('GitHubEvent', function() {
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

      describe('insert', function() {
        it('should return a promise', function(done) {
          var row = { recorded_at: 1, payload: {} };
          expect(GitHubEvent.insert(row).then).to.be.a.function();
          done();
        });
      }); // end 'insert'
    });
  }); // end 'models'
}); // end 'common'
