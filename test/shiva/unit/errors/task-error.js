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

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });
var TaskError = require('errors/task-error');

describe('errors', function() {
  describe('TaskError', function() {
    describe('class', function() {
      it('should extend `Error`', function(done) {
        var e = new TaskError('task', 'message');
        expect(e instanceof Error).to.be.true();
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

      it('should set the message and data', function(done) {
        var task = 'a-task';
        var message = 'a sweet message';
        var data = { foo: 'bar' };
        new TaskError(task, message, data);
        expect(TaskError.prototype.setMessageAndData.calledWith(
          task, message, data
        )).to.be.true();
        done();
      });
    }); // end 'constructor'

    describe('setMessageAndData', function() {
      var e = new TaskError('', '', {});

      it('should set the correct message', function(done) {
        var task = 'some-task';
        var message = 'some-message';
        var expectedMessage = task + ': ' + message;
        e.setMessageAndData(task, message);
        expect(e.message).to.equal(expectedMessage);
        done();
      });

      it('should always set a data for the error', function(done) {
        e.setMessageAndData('', '');
        expect(e.data).to.be.an.object();
        done();
      });

      it('should set the task name in the error data', function(done) {
        var task = 'a-task-yo';
        e.setMessageAndData(task, '');
        expect(e.data.task).to.equal(task);
        done();
      });

      it('should include user defined data', function(done) {
        var data = { foo: 'bar', boo: 'far' };
        e.setMessageAndData('', '', data);
        expect(e.data.foo).to.equal(data.foo);
        expect(e.data.boo).to.equal(data.boo);
        done();
      });
    }); // end 'setMessageAndData'
  }); // end 'TaskError'
}); // end 'errors'
