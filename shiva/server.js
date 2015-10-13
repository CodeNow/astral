'use strict';

var queue = require('./queue');
var Worker = require('./worker');
var log = require('./logger');

/**
 * Worker server, connects to the appropriate queues in RabbitMQ and begins
 * handling incoming jobs.
 * @author Ryan Sandor Richards
 * @module shiva
 */
var server = module.exports = {
  start: start,
  stop: stop,
  subscribe: subscribe
};

/**
 * Starts listening to all job queues.
 */
function start(cb) {
  log.info('Starting shiva worker server');
  queue.connect(function (err) {
    if (err) { return cb(err); }
    // NOTE `server.subscribe` here so we can use sinon during unit testing
    queue.queues.forEach(server.subscribe);
    log.info('Shiva worker server started.');
    cb();
  });
}

/**
 * Subscribes a worker handler for a given queue name.
 * @param {string} name Name of the queue.
 */
function subscribe(name) {
  log.info({ queue: name }, 'Subscribing to queue: ' + name);
  queue.subscribe(name, function (job, done) {
    // TODO Eventually we'll need NACK on error if we cannot handle the job
    //      due to a missing task handler. "Should" be okay for now.
    Worker.create(name, job, done);
  });
}

/**
 * Stops listening to all job queues.
 * @param {function} cb Callback to execute once the server has been stopped.
 */
function stop(cb) {
  log.info('Stopping worker server.');
  queue.close(cb);
}
