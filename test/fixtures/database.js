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
  createInstances: createInstances,
  createVolume: createVolume,
  createVolumes: createVolumes,
  setInstanceVolumes: setInstanceVolumes
};

/**
 * Truncates all tables in the database.
 * @param cb Callback to execute after each table has been truncated.
 */
function truncate(cb) {
  foreignKeys.remove().then(function () {
    return db('clusters').truncate();
  }).then(function () {
    return db('instances').truncate();
  }).then(function () {
    return db('volumes').truncate();
  }).then(function () {
    return db('instance_volumes').truncate();
  }).then(function () {
    return foreignKeys.add();
  }).asCallback(cb);
}

/**
 * Creates a new cluster in the test database.
 * @param {string} cluster_id Id of the cluster to create.
 * @param {object} [fields] Overrides the default columns for the cluster row.
 * @return {knex~promise} A promise for the insert query.
 */
function createCluster(cluster_id, fields) {
  var defaultValues = {
    org: '1',
    state: 'down',
    security_group_id: 'security-group-id',
    ssh_key_name: 'ssh-key-name',
    subnet: '10.0.0.0/24'
  };
  var row = { id: cluster_id };
  if (isObject(fields)) {
    defaults(row, fields);
  }
  defaults(row, defaultValues);
  return db('clusters').insert(row);
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
    ami_version: '1.0.0',
    aws_type: 't2.micro',
    ram: '1024',
    cpu: '1'
  };
  var row = { id: instance_id, cluster_id: cluster_id };
  if (isObject(fields)) {
    defaults(row, fields);
  }
  defaults(row, defaultValues);
  return db('instances').insert(row);
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
    ami_version: '1.0.0',
    aws_type: 't2.micro',
    ram: '1024',
    cpu: '1'
  };
  return db('instances').insert(instance_ids.map(function (id) {
    var row = { id: id, cluster_id: cluster_id };
    defaults(row, defaultValues);
    return row;
  }));
}

/**
 * Creates a new volume in the test database.
 * @param {string} volume_id Id of the volume to create.
 * @param {string} cluster_id Id of the cluster for the volume.
 * @param {object} [fields] Overrides the default columns for a volume.
 * @return {knex~promise} A promise for the query.
 */
function createVolume(volume_id, cluster_id) {
  var defaultValues = {
    id: '1',
    cluster_id: '1',
    volume_type: 'awesome',
    size: '1024'
  };
  var row = { id: volume_id, cluster_id: cluster_id };
  if (isObject(fields)) {
    defaults(row, fields);
  }
  defaults(row, defaultValues);
  return db('volumes').insert(row);
}

/**
 * Creates many volumes for a cluster.
 * @param {array} volume_ids Ids for the volumes.
 * @param {string} cluster_id Id of the cluster.
 * @return {knex-promise} A promise for the query.
 */
function createVolumes(volume_ids, cluster_id) {
  var defaultValues = {
    id: '1',
    cluster_id: '1',
    volume_type: 'awesome',
    size: '1024'
  };
  return db('volumes').insert(volume_ids.map(function (id) {
    var row = { id: id, cluster_id: cluster_id };
    defaults(row, defaultValues);
    return row;
  }));
}

/**
 * Associates a given instance with the given volume ids.
 * @param {string} instance_id Id of the instance to associate.
 * @param {array} volume_ids Ids for the volumes to associate.
 * @return {knex~promise} A promise for the query.
 */
function setInstanceVolumes(instance_id, volume_ids) {
  return db('instance_volumes').insert(volume_ids.map(function (volume_id) {
    return { instance_id: instance_id, volume_id: volume_id }
  }));
}
