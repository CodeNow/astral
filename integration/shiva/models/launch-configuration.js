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

// People may have legit keys in their default environment, they may not work
// so hack them out before loading the environment.
delete process.env.AWS_ACCESS_KEY_ID;
delete process.env.AWS_SECRET_ACCESS_KEY;
require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var exists = require('101/exists');
var LaunchConfiguration = require(process.env.ASTRAL_ROOT + 'shiva/models/launch-configuration');

describe('shiva', function() {
  describe('integration', function() {
    describe('models', function () {
      describe('launch-configuration', function () {
        var name = 'test-lc';

        it('should create a new LaunchConfiguration', function(done) {
          LaunchConfiguration.create(name).asCallback(done);
        });

        it('should describe a given launch configuration', function(done) {
          LaunchConfiguration.get(name)
            .then(function (data) {
              var lcs = data.LaunchConfigurations;
              expect(lcs.length).to.equal(1);
              expect(lcs[0].LaunchConfigurationName).to.equal(name);
              done();
            })
            .catch(done);
        });

        it('should remove the launch configuration', function(done) {
          LaunchConfiguration.remove(name).asCallback(done);
        });
      }); // end 'launch-configuration'
    }); //end 'models'
  }); // end 'integration'
}); // end 'shiva'
