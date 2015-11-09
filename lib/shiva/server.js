'use strict';

var log = require('./logger');
var ponos = require('ponos');

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
  'cluster-delete',
  'shiva-asg-provision'
];

/**
 * Singelton instance of the worker server.
 * @module shiva:server
 */
var server = module.exports = new ponos.Server({ queues: queues, log: log });

// Set the task handlers for each queue
queues.forEach(function (name) {
  var task = require('./tasks/' + name);
  server.setTask(name, task);
});
