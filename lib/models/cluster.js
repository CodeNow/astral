'use strict';

var defaults = require('101/defaults');
var util = require('util');
var uuid = require('uuid');

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
 * Determines if a cluster with the given github organization exists.
 * @param {string} githubId Id of the github organization.
 * @return {knex~Promise} A promise for the query.
 */
Cluster.prototype.githubOrgExists = function (githubId) {
  return this.count().where({ 'github_id': githubId })
    .map(function (row) { return row.count > 0; })
    .reduce(function (memo, curr) { return curr; }, false);
};

/**
 * Finds a cluster with the given github organization id.
 * @param {string} githubId Id of the github organization.
 * @return {knex~Promise} A promise for the query.
 */
Cluster.prototype.getByGithubId = function (githubId) {
  return this.select().where({ 'github_id': githubId })
    .reduce(function (memo, row) { return row; }, null);
};

/**
 * Extends basic model insert functionality to ensure that clusters are added
 * with a UUID for the id field.
 * @param {object} data Fields to insert into the database.
 * @return {knex~Promise} A knex promise for the query.
 */
Cluster.prototype.insert = function (data) {
  defaults(data, { id: uuid.v1() });
  return Model.prototype.insert.call(this, data);
};

/**
 * Determines a list of instances in the cluster.
 * @param {string} clusterId Id of the cluster.
 * @return {knex~promise} A knex promise for the query.
 */
Cluster.prototype.getInstances = function (clusterId) {
  return instance.select().where({ 'cluster_id': clusterId });
};

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Cluster();
