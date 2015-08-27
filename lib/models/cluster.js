'use strict';

var util = require('util');
var Model = require('./model');
var instance = require('./instance');

/**
 * Model for handling the `clusters` table.
 * @class
 */
function Cluster() {
  Model.call(this, 'clusters', 'id');
}
util.inherits(Cluster, Model);

/**
 * Determines the number of instances of a given type in a cluster.
 * @param {string} cluster_id Id of the cluster.
 * @param {string} type The type of the instance.
 * @return {knex~promise} A knex promise for the query.
 */
Cluster.prototype.countInstances = function (cluster_id, type) {
  return instance.count()
    .where({
      cluster_id: cluster_id,
      type: type
    }).map(function (row) {
      return row.count;
    }).reduce(function (memo, row) {
      return memo + parseInt(row);
    }, 0);
};

/**
 * Determines a list of instances in the cluster.
 * @param {string} cluster_id Id of the cluster.
 * @return {knex~promise} A knex promise for the query.
 */
Cluster.prototype.getInstances = function (cluster_id, type) {
  return instance.select().where({ cluster_id: cluster_id });
};

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Cluster();
