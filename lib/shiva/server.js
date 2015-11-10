'use strict';

var log = require('./logger');
var ponos = require('ponos');

/**
 * Names of the job queues that are consumed by shiva.
 * @type {array}
 */
var queues = [
  // Old-world queues, individual instance creation/deletion...
  'cluster-provision',
  'cluster-instance-provision',
  'cluster-instance-wait',
  'cluster-instance-tag',
  'cluster-instance-write',
  'cluster-instance-terminate',
  'cluster-instance-delete',
  'cluster-deprovision',
  'cluster-delete',
  // New-world queues. ASG based build clusters...
  'shiva-asg-create',
  'shiva-asg-delete'
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
