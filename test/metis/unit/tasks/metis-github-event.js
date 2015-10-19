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

describe('metis', function() {
  describe('tasks', function() {
    describe('metis-github-event', function() {
      // TODO Implement tests
    }); // end 'metis-github-event'
  }); // end 'tasks'
}); // end 'metis'
