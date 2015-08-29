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

var noop = require('101/noop');
var server = require('server');
var queue = require('queue');
var Worker = require('worker');

describe('server', function() {
  beforeEach(function (done) {
    sinon.stub(Worker, 'create');
    sinon.stub(queue, 'connect').yieldsAsync();
    sinon.stub(queue, 'close').yieldsAsync();
    sinon.stub(queue, 'subscribe');
    done();
  });

  afterEach(function (done) {
    Worker.create.restore();
    queue.connect.restore();
    queue.close.restore();
    queue.subscribe.restore();
    done();
  });

  describe('start', function() {
    beforeEach(function (done) {
      sinon.spy(server, 'subscribe');
      done();
    });

    afterEach(function (done) {
      server.subscribe.restore();
      done();
    });

    it('should connect to rabbitmq', function(done) {
      server.start(function (err) {
        if (err) { done(err); }
        expect(queue.connect.calledOnce).to.be.true();
        done();
      });
    });

    it('should subscribe to all queues', function(done) {
      server.start(function (err) {
        if (err) { done(err); }
        var expectedCallCount = queue.queues.length;
        expect(server.subscribe.callCount).to.equal(expectedCallCount);
        queue.queues.forEach(function (name) {
          expect(server.subscribe.calledWith(name)).to.be.true();
        });
        done();
      });
    });

    it('should correctly handle connection errors', function(done) {
      var queueError = new Error('Rabbit is napping');
      queue.connect.yieldsAsync(queueError);
      server.start(function (err) {
        expect(err).to.equal(queueError);
        done();
      });
    });
  }); // end 'start'

  describe('subscribe', function() {
    it('should subscribe to the given queue', function(done) {
      var name = 'some-queue-name';
      server.subscribe(name);
      expect(queue.subscribe.calledWith(name)).to.be.true();
      done();
    });

    it('should create a handler that spawns the correct worker', function(done) {
      var name = 'totes-a-queue';
      var job = { foo: 'bar' };
      var jobDoneFn = noop;

      server.subscribe(name);
      var handler = queue.subscribe.firstCall.args[1];

      handler(job, jobDoneFn);
      expect(Worker.create.calledOnce).to.be.true();
      expect(Worker.create.calledWith(name, job, jobDoneFn)).to.be.true();

      done();
    });
  }); // end 'subscribe'

  describe('stop', function() {
    it('should close the queue', function(done) {
      server.stop(function (err) {
        if (err) { done(err); }
        expect(queue.close.calledOnce).to.be.true();
        done();
      });
    });
  }); // end 'stop'
}); // end 'server'
