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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'metis', debugName: 'astral:metis:test' });

var bunyan = require('bunyan');
var logger = require(process.env.ASTRAL_ROOT + 'metis/logger');

describe('metis', function() {
  describe('logger', function() {
    describe('serializers', function() {
      describe('job', function() {
        it('should serialize non-githubEventData fields', function(done) {
          var job = { a: 'a', b: 'b', c: 'foo' };
          expect(logger.serializers.job(job)).to.deep.equal(job);
          done();
        });

        it('should remove `githubEventData`', function(done) {
          var result = logger.serializers.job({
            type: 'neat',
            githubEventData: 'wow'
          });
          expect(result.githubEventData).to.not.exist();
          done();
        });
      }); // end 'job'
    }); // end 'serializers'
  }); // end 'logger'
}); // end 'metis'
