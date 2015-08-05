'use strict';

var cluster = require('../models/cluster');

/**
 * The cluster create task.
 * @author Ryan Sandor Richards
 * @module shiva:tasks
 */
module.exports = createCluster;

/**
 * Creates a build/run cluster for an organization.
 * @param {object} event The event for the task.
 * @param {string} event.id Unique identifier for the event.
 * @param {string} event.org The Github id for the organization.
 */
function createCluster(event) {

  

  cluster.select()
    .where({ org: parseInt(event.org) }).limit(1)
  .then(function (rows) {

  });
}
