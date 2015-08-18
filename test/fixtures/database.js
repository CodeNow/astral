'use strict';

var defaults = require('101/defaults');
var isObject = require('101/is-object');
var debug = require('debug')('shiva:test:fixtures');
var db = require('database');
var foreignKeys = require('./foreign-keys');

/**
 * Helpers for setting up the database during functional tests.
 * @author Ryan Sandor Richards
 * @module shiva:test:fixtures
 */
module.exports = {
  truncate: truncate,
  createCluster: createCluster,
  createInstance: createInstance,
  createInstances: createInstances
};

/**
 * Truncates all tables in the database.
 * @param cb Callback to execute after each table has been truncated.
 */
function truncate(cb) {
  foreignKeys.remove()
    .then(function () {
      var truncateClusters = db('clusters').truncate();
      debug(truncateClusters.toString());
      return truncateClusters;
    })
    .then(function () {
      var truncateInstances = db('instances').truncate();
      debug(truncateInstances.toString());
      return truncateInstances;
    })
    .then(function () {
      return foreignKeys.add();
    })
    .asCallback(cb);
}

/**
 * Creates a new cluster in the test database.
 * @param {string} cluster_id Id of the cluster to create.
 * @param {object} [fields] Overrides the default columns for the cluster row.
 * @return {knex~promise} A promise for the insert query.
 */
function createCluster(cluster_id, fields) {
  var defaultValues = {
    security_group_id: 'security-group-id',
    ssh_key_name: 'ssh-key-name',
    subnet_id: 'subnet-id'
  };
  var row = { id: cluster_id };
  if (isObject(fields)) {
    defaults(row, fields);
  }
  defaults(row, defaultValues);

  var clusterInsert = db('clusters').insert(row);
  debug(clusterInsert.toString());
  return clusterInsert;
}

/**
 * Creates a new instance in the test database.
 * @param {string} instance_id Id for the instance to create.
 * @param {string} cluster_id Id of the cluster for the instance.
 * @param {object} [fields] Overrides the default columns for the instance.
 * @return {knex~promise} A promise for the insert query.
 */
function createInstance(instance_id, cluster_id, fields) {
  var defaultValues = {
    type: 'build',
    ami_id: '1234',
    aws_type: 't2.micro'
  };
  var row = { id: instance_id, cluster_id: cluster_id };
  if (isObject(fields)) {
    defaults(row, fields);
  }
  defaults(row, defaultValues);

  var instanceInsert = db('instances').insert(row);
  debug(instanceInsert.toString());
  return instanceInsert;
}

/**
 * Creates many instances with the given ids.
 * @param {array} instance_ids Ids for the instances.
 * @param {string} cluster_id Id of the cluster.
 * @return {knex~promise} A promise for the query.
 */
function createInstances(instance_ids, cluster_id) {
  var defaultValues = {
    type: 'build',
    ami_id: '1234',
    aws_type: 't2.micro'
  };

  var instancesInsert = db('instances').insert(instance_ids.map(function (id) {
    var row = { id: id, cluster_id: cluster_id };
    defaults(row, defaultValues);
    return row;
  }));
  debug(instancesInsert.toString());
  return instancesInsert;
}
