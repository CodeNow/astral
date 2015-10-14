'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:env' });

/**
 * Queue names for hermes.
 * @type Array
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
 * Hermes adapter for rabbitmq.
 * @author Ryan Sandor Richards
 */
module.exports = require('runnable-hermes').hermesSingletonFactory(
  {
    hostname: process.env.RABBITMQ_HOSTNAME,
    port: process.env.RABBITMQ_PORT,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
    queues: queues
  },
  {
    heartbeat: 5 * 60
  }
);