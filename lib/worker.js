'use strict';

var exists = require('101/exists');
var log = require('./logger').child({ module: 'worker' });
var error = require('./error');
var TaskFatalError = require('./errors/task-fatal-error');

/**
 * Worker module, for performing job tasks.
 * @author Ryan Sandor Richards
 * @module shiva
 */
module.exports = Worker;

/**
 * Worker class: performs tasks for jobs on a given queue.
 * @class
 * @param {string} queue Name of the queue for the job the worker is processing.
 * @param {object} job Data for the job to process.
 * @param {function} done Callback to execute when the job has successfully
 *   been completed.
 * @param {boolean} [runNow] Whether or not to run the job immediately, defaults
 *   to `true`.
 */
function Worker(queue, job, done, runNow) {
  this.queue = queue;
  this.job = job;
  this.done = done;

  this.retryDelay = process.env.WORKER_MIN_RETRY_DELAY;
  this.attempt = 0;

  // Attempt to load the task handler for the queue
  try {
    this.task = this.getTask();
  }
  catch (err) {
    return error.createAndReport(
      500,
      'No worker task found to handle jobs from given queue',
      { queue: queue, job: job, originalError: err }
    );
  }

  log.info({ queue: queue, job: job }, 'Worker created');

  if (!exists(runNow) || runNow === true) {
    this.run();
  }
}

/**
 * Factory method for creating new workers. This method exists to make it easier
 * to unit test other modules that need to instantiate new workers.
 * @see Worker
 */
Worker.create = function (queue, job, done, runNow) {
  return new Worker(queue, job, done, runNow);
};

/**
 * Attempts to load a task method for the worker's queue.
 * @return {function} A task that can perform a job in the queue.
 * @throws {Error} If no task method with the queue name exists.
 */
Worker.prototype.getTask = function () {
  return require('./tasks/' + this.queue);
};

/**
 * Runs the worker. If the task for the job fails, then this method will retry
 * the task (with an exponential backoff) a number of times defined by the
 * environment of the process.
 */
Worker.prototype.run = function () {
  var self = this;
  this.attempt++;

  log.info({
    queue: this.queue,
    job: this.job,
    attempt: this.attempt
  }, 'Running task');

  return this.task(this.job)
    .then(function (result) {
      log.info({
        queue: self.queue,
        job: self.job,
        result: result
      }, 'Job complete');
      self.done();
    })
    .catch(TaskFatalError, function (fatalError) {
      // If we encounter a fatal error we should no longer try to schedule
      // the job.
      // TODO need to add negative acknowledgements here when they are ready
      return;
    })
    .catch(function (err) {
      // Check if we've exceeded the maximum number of retries
      if (self.attempt > process.env.WORKER_MAX_RETRIES) {
        // TODO need to add negative acknowledgements here when they are ready
        return error.createAndReport(500, 'Worker unable to complete job', {
          queue: self.queue,
          job: self.job,
          attempts: self.attempt
        });
      }

      log.warn({
        queue: self.queue,
        job: self.job,
        nextAttemptDelay: self.retryDelay
      }, 'Task failed, retrying');

      // Try again after a delay
      setTimeout(function () { self.run(); }, this.retryDelay);

      // Exponentially increase the retry delay
      if (self.retryDelay < process.env.WORKER_MAX_RETRY_DELAY) {
        self.retryDelay *= 2;
      }
    });
};
