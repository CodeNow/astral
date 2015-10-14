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
var noop = require('101/noop');
var Promise = require('bluebird');
var logger = require('logger');
var Worker = require('worker');
var error = require('error');
var monitor = require('monitor-dog');
var TaskFatalError = require('errors/task-fatal-error');

describe('Worker', function() {
  beforeEach(function (done) {
    sinon.spy(monitor, 'increment');
    done();
  });

  afterEach(function (done) {
    monitor.increment.restore();
    done();
  });

  describe('constructor', function() {
    beforeEach(function (done) {
      sinon.stub(Worker.prototype, 'getTask').returns(noop);
      sinon.stub(Worker.prototype, 'run');
      sinon.spy(error, 'createAndReport');
      done();
    });

    afterEach(function (done) {
      Worker.prototype.getTask.restore();
      Worker.prototype.run.restore();
      error.createAndReport.restore();
      done();
    });

    it('should set the queue', function(done) {
      var queue = 'example-queue';
      var worker = new Worker(queue, {}, noop);
      expect(worker.queue).to.equal(queue);
      done();
    });

    it('should set the job', function(done) {
      var job = { foo: 'bar' };
      var worker = new Worker('queue', job, noop);
      expect(worker.job).to.equal(job);
      done();
    });

    it('should set the done callback', function(done) {
      var worker = new Worker('queue', {}, noop);
      expect(worker.done).to.equal(noop);
      done();
    });

    it('should set the initial retry delay', function(done) {
      var worker = new Worker('queue', {}, noop);
      expect(worker.retryDelay)
        .to.equal(process.env.WORKER_MIN_RETRY_DELAY);
      done();
    });

    it('should set the initial number of attempts', function(done) {
      var worker = new Worker('queue', {}, noop);
      expect(worker.attempt).to.equal(0);
      done();
    });

    it('should set the task via `getTask`', function(done) {
      var worker = new Worker('queue', {}, noop);
      expect(Worker.prototype.getTask.calledOnce).to.be.true();
      expect(worker.task).to.equal(worker.getTask());
      done();
    });

    it('should run the task by default', function(done) {
      var worker = new Worker('queue', {}, noop);
      expect(Worker.prototype.run.calledOnce).to.be.true();
      done();
    });

    it('should run the task when instructed to do so', function(done) {
      var worker = new Worker('queue', {}, noop, true);
      expect(Worker.prototype.run.calledOnce).to.be.true();
      done();
    });

    it('should not run the task when instructed to not do so', function(done) {
      var worker = new Worker('queue', {}, noop, false);
      expect(Worker.prototype.run.callCount).to.equal(0);
      done();
    });

    it('should report an error if the task could not be found', function(done) {
      Worker.prototype.getTask.throws(new Error());
      var worker = new Worker('queue', {}, noop);
      expect(error.createAndReport.calledWith(
        500, 'No worker task found to handle jobs from given queue'
      )).to.be.true();
      done();
    });

    it('should report worker creation to datadog', function(done) {
      var woker = new Worker('some-queue', {}, noop, false);
      expect(monitor.increment.calledWith('worker.some-queue.start'))
        .to.be.true();
      done();
    });

    it('should report task handler errors to datadog', function(done) {
      Worker.prototype.getTask.throws(new Error());
      var worker = new Worker('queue', {}, noop);
      expect(monitor.increment.calledWith('worker.queue.no-handler'))
        .to.be.true();
      done();
    });
  }); // end 'constructor'

  describe('create', function() {
    beforeEach(function (done) {
      sinon.stub(Worker.prototype, 'getTask').returns(noop);
      done();
    });

    afterEach(function (done) {
      Worker.prototype.getTask.restore();
      done();
    });

    it('should create a new worker', function(done) {
      expect(Worker.create('queue', {}, noop, false))
        .to.be.an.instanceof(Worker);
      done();
    });
  }); // end 'create'

  describe('getTask', function() {
    var worker;

    beforeEach(function (done) {
      sinon.stub(Worker.prototype, 'run');
      worker = new Worker('cluster-provision');
      done();
    });

    afterEach(function (done) {
      Worker.prototype.run.restore();
      done();
    });

    it('should correctly load a task function', function(done) {
      var task = worker.getTask('check-cluster-ready');
      expect(task).to.be.a.function();
      done();
    });

    it('should throw an exeception if the task is invalid', function(done) {
      expect(worker.getTask).to.throw();
      done();
    });
  }); // end 'getTask'

  describe('run', function() {
    var worker;
    var clock;
    var job = { foo: 'bar' };
    var resolve = function () { return Promise.resolve(); };
    var reject = function () { return Promise.reject(); };
    var rejectFatal = function () {
      return Promise.reject(new TaskFatalError('', ''));
    };
    var doneCallback = function () {};

    beforeEach(function (done) {
      sinon.stub(Worker.prototype, 'getTask').returns(resolve);
      worker = new Worker('queue', job, doneCallback, false);
      sinon.spy(worker, 'task');
      sinon.spy(worker, 'done');
      clock = sinon.useFakeTimers();
      done();
    });

    afterEach(function (done) {
      Worker.prototype.getTask.restore();
      clock.restore();
      done();
    });

    it('should execute the task with the job', function(done) {
      worker.run();
      expect(worker.task.calledWith(job)).to.be.true();
      done();
    });

    it('should execute `done` when the task resolves', function(done) {
      worker.run().then(function () {
        expect(worker.done.calledOnce).to.be.true();
        done();
      }).catch(done);
    });

    it('should report work complete to datadog', function(done) {
      worker.run()
        .then(function () {
          expect(monitor.increment.calledWith('worker.queue.complete'))
            .to.be.true();
          done();
        })
        .catch(done);
    });

    it('should retry if the task fails', function(done) {
      worker.task = reject;
      worker.run()
        .then(function () {
          sinon.stub(worker, 'run');
          clock.tick(process.env.WORKER_MAX_RETRY_DELAY);
          expect(worker.run.calledOnce).to.be.true();
          done();
        })
        .catch(done);
    });

    it('should report retries to datadog', function(done) {
      worker.task = reject;
      worker.run()
        .then(function () {
          sinon.stub(worker, 'run');
          clock.tick(process.env.WORKER_MAX_RETRY_DELAY);
          expect(monitor.increment.calledWith('worker.queue.retry'))
            .to.be.true();
          done();
        })
        .catch(done);
    });

    it('should exponentially backoff retries', function(done) {
      worker.task = reject;
      worker.run().then(function () {
        expect(worker.retryDelay).to.equal(
          2 * process.env.WORKER_MIN_RETRY_DELAY
        );
        done();
      }).catch(done);
    });

    it('should not exceed the maximum retry delay', function(done) {
      worker.retryDelay = process.env.WORKER_MAX_RETRY_DELAY;
      worker.task = reject;
      worker.run().then(function () {
        expect(worker.retryDelay).to.equal(process.env.WORKER_MAX_RETRY_DELAY);
        done();
      }).catch(done);
    });

    it('should not exceed the maximum nuber of retries', function(done) {
      worker.attempt = process.env.WORKER_MAX_RETRIES + 1;
      worker.task = reject;
      worker.run().then(function () {
        sinon.stub(worker, 'run');
        clock.tick(process.env.WORKER_MAX_RETRY_DELAY);
        expect(worker.run.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should stop upon encountering a TaskFatalError', function(done) {
      worker.task = rejectFatal;
      worker.run().then(function () {
        sinon.stub(worker, 'run');
        expect(worker.done.calledOnce).to.be.true();
        clock.tick(process.env.WORKER_MAX_RETRY_DELAY);
        expect(worker.run.callCount).to.equal(0);
        done();
      }).catch(done);
    });

    it('should report fatal errors to datadog', function(done) {
      worker.task = rejectFatal;
      worker.run().then(function () {
        sinon.stub(worker, 'run');
        expect(worker.done.calledOnce).to.be.true();
        expect(monitor.increment.calledWith('worker.queue.fatal'))
          .to.be.true();
        done();
      }).catch(done);
    });
  }); // end 'run'
}); // end 'Worker'