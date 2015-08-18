'use strict';

require('loadenv')('shiva:env');

/**
 * Queue names for hermes.
 * @type Array
 */
var queues = [
  'cluster-provision',
  'cluster-instance-provision',
  'cluster-instance-wait',
  'cluster-instance-tag',
  'cluster-instance-write'
];

/**
 * Hermes adapter for rabbitmq.
 * @author Ryan Sandor Richards
 */
var hermes = module.exports = require('runnable-hermes').hermesSingletonFactory({
  hostname: process.env.RABBITMQ_HOSTNAME,
  port: process.env.RABBITMQ_PORT,
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
  queues: queues
});
