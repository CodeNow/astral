'use strict';

var util = require('util');
var Model = require('./model');
var instance = require('./instance');
var volume = require('./volume');
var uuid = require('uuid');

/**
 * Model for handling the `clusters` table.
 * @class
 */
function Cluster() {
  Model.call(this, 'clusters', 'id');
}
util.inherits(Cluster, Model);

/**
 * Determines a list of instances in the cluster.
 * @param {string} cluster_id Id of the cluster.
 * @return {knex~promise} A knex promise for the query.
 */
Cluster.prototype.getInstances = function (cluster_id) {
  return instance.select().where({ cluster_id: cluster_id });
};

/**
 * Determines a list of volumes in the cluster.
 * @param {string} cluster_id Id of the cluster.
 * @return {knex~promise} A knex promise for the query.
 */
Cluster.prototype.getVolumes = function (cluster_id) {
  return volume.select().where({ cluster_id: cluster_id });
};

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Cluster();
