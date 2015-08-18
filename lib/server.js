'use strict';

var queue = require('./queue');
var Worker = require('./worker');

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
  queue.connect(function (err) {
    if (err) { return cb(err); }
    // NOTE `server.subscribe` here so we can use sinon during unit testing
    queue.queues.forEach(server.subscribe);
    cb();
  });
}

/**
 * Subscribes a worker handler for a given queue name.
 * @param {string} name Name of the queue.
 */
function subscribe(name) {
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
  queue.close(cb);
}
