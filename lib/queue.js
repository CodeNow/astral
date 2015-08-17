'use strict';

require('loadenv')('shiva:env');

/**
 * Queue names for hermes.
 * @type Array
 */
var queues = [
  'check-cluster-ready',
  'check-instances-ready',
  'create-cluster',
  'create-instances',
  'write-instances'
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

// Connect to rabbitmq
hermes.connect();
