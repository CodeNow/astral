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

require('loadenv')('shiva:test');
var TaskError = require('errors/task-error');
var TaskFatalError = require('errors/task-fatal-error');

describe('errors', function() {
  describe('TaskFatalError', function() {
    describe('class', function() {
      it('should extend `TaskError`', function(done) {
        var e = new TaskFatalError('task', 'message');
        expect(e instanceof TaskError).to.be.true();
        done();
      });
    }); // end 'class'

    describe('constructor', function() {
      beforeEach(function (done) {
        sinon.spy(TaskError.prototype, 'setMessageAndData');
        done();
      });

      afterEach(function (done) {
        TaskError.prototype.setMessageAndData.restore();
        done();
      });

      it('should initialize the message and data', function(done) {
        var task = 'name';
        var message = 'something';
        var data = { foo: 'bart' };
        var e = new TaskFatalError(task, message, data);
        expect(TaskError.prototype.setMessageAndData.calledWith(
          task, message, data
        )).to.be.true();
        done();
      });
    }); // end 'constructor'
  }); // end 'TaskFatalError'
}); // end 'errors'
