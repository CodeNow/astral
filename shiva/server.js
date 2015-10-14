'use strict';

var log = require('./logger');
var ponos = require('ponos');
var Promise = require('bluebird');

/**
 * Ponos worker server instance for shiva.
 * @author Ryan Sandor Richards
 * @module shiva
 */
module.exports = { getInstance: getInstance }

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
 * Singelton instance of the worker server.
 * @type {ponos.Server}
 */
var server;

/**
 * @return An instance of the worker server.
 */
function getInstance() {
  if (server) {
    return server;
  }
  server = new ponos.Server({ queues: queues, log: log });

  Promise.resolve(queues)
    .map(function(name) {
      return server.setTask(name, require('./tasks/' + name));
    });

  return server;
}
