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

var loadenv = require('loadenv');
loadenv.restore();
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' });

var aws = require(process.env.ASTRAL_ROOT + 'shiva/models/aws');

describe('shiva', function () {
  describe('models', function () {
    describe('aws', function() {
      it('should expose a promisified `AutoScaling` sdk', function(done) {
        expect(aws.AutoScaling).to.exist();
        expect(aws.AutoScaling.createLaunchConfigurationAsync)
          .to.be.a.function();
        done();
      });
    }); // end 'aws'
  }); // end 'models'
}); // end 'shiva'
