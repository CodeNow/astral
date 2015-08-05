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
 * Finds a cluster by organization id.
 * @param {string} org Organization id.
 * @return {Promise} A promise for the query.
 */
Cluster.prototype.getByOrg = function (org) {
  return this.select()
    .where({ org: org })
    .limit(1)
    .reduce(function (memo, row) { return row }, null);
};

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
 * Inserts a new row into the clusters table. Also ensures that the given data
 * has a unique id if one was not provided.
 * @param {object} data Data for the record to insert.
 * @return {knex~promise} A promise for the query.
 */
Cluster.prototype.insert = function (data) {
  if (!data.id) {
    data.id = uuid.v1();
  }
  return Model.prototype.insert.call(this, data);
};

/**
 * Determines if a cluster exists for the given organization.
 * @param {string} org Id of the organization.
 * @return {knex~promise} A promise for the query.
 */
Cluster.prototype.orgExists = function (org) {
  return this.count().where({ org: org }).limit(1)
    .map(function (row) { return row.count > 0; })
    .reduce(function (memo, row) { return row; }, false);
}

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Cluster();
