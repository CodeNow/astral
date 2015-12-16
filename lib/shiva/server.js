'use strict';

var isFunction = require('101/is-function');
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
  // New-world queues, ASG based build clusters...
  'shiva.asg.create',
  'shiva.asg.delete',
  'shiva.asg.update'
];

/**
 * Task handlers for new style queues (can no longer just use the file name).
 * @type {object}
 */
var queueTasks = {
  'shiva.asg.create': require('./tasks/shiva-asg-create'),
  'shiva.asg.delete': require('./tasks/shiva-asg-delete'),
  'shiva.asg.update': require('./tasks/shiva-asg-update')
};

/**
 * Singelton instance of the worker server.
 * @module shiva:server
 */
var server = module.exports = new ponos.Server({ queues: queues, log: log });

// Set the task handlers for each queue
queues.forEach(function (name) {
  var task = queueTasks[name];
  if (!isFunction(task)) {
    task = require('./tasks/' + name);
  }
  server.setTask(name, task);
});
