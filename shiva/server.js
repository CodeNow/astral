'use strict';

var log = require('./logger');
var ponos = require('ponos');
var Promise = require('bluebird');

/**
 * Names of the job queues that are consumed by shiva.
 * @type {array}
 */
var queues = [
  'cluster-provision',
  'cluster-instance-provision',
  'cluster-instance-wait',
  'cluster-instance-tag',
  'cluster-instance-write',
  'cluster-instance-terminate',
  'cluster-instance-delete',
  'cluster-deprovision',
  'cluster-delete'
];

/**
 * Ponos worker server instance for shiva.
 * @author Ryan Sandor Richards
 * @module shiva
 */
var server = module.exports = new ponos.Server({ queues: queues, log: log });

// Map the shiva task handlers to the given queue names
Promise.resolve(queues)
  .map(function(name) {
    return server.setTask(name, require('./tasks/' + name));
  })
  .catch(function (err) {
    log.fatal({ err: err }, 'Error setting task for queue.');
    server.errorCat.report(err);
    process.exit(1);
  });
