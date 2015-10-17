'use strict';

require('loadenv')({ project: 'shiva', debugName: 'astral:shiva:test' });

var defaults = require('101/defaults');
var isObject = require('101/is-object');
var uuid = require('uuid');
var debug = require('debug')('shiva:test:fixtures');
var db = require(process.env.ASTRAL_ROOT + 'common/database');
var aws = require(process.env.ASTRAL_ROOT + 'shiva/aws');
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
  createInstances: createInstances,
  terminateInstances: terminateInstances
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
 * @param {string} cluster_id Id for the cluster.
 * @param {object} [fields] Overrides the default columns for the cluster row.
 * @return {knex~promise} A promise for the insert query.
 */
function createCluster(cluster_id, fields) {
  var row = { id: cluster_id };
  if (isObject(fields)) {
    defaults(row, fields);
  }
  defaults(row, { 'github_id': uuid.v1() });
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
    role: 'dock',
    aws_image_id: '1234',
    aws_instance_type: 't2.micro',
    aws_private_ip_address: '10.20.0.0'
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
    role: 'dock',
    aws_image_id: '1234',
    aws_instance_type: 't2.micro',
    aws_private_ip_address: '10.20.0.0'
  };

  var instancesInsert = db('instances').insert(instance_ids.map(function (id) {
    var row = { id: id, cluster_id: cluster_id };
    defaults(row, defaultValues);
    return row;
  }));
  debug(instancesInsert.toString());
  return instancesInsert;
}

/**
 * Terminates any instances still residing in the database.
 * @param  {Function} cb Callback to execute after completion.
 */
function terminateInstances(cb) {
  db.select('id').from('instances')
    .map(function (row) {
      return row.id;
    })
    .then(function (ids) {
      if (ids.length === 0) { return; }
      return aws.terminateInstances({ InstanceIds: ids });
    })
    .then(function () {
      cb();
    })
    .catch(function (err) {
      // No need to panic here, its okay if this fails
      console.error("[OK] terminateInstances failed: ", err);
    });
}
