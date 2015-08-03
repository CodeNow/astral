'use strict';

var util = require('util');
var Model = require('./model');
var volume = require('./volume');

/**
 * Model for handling the `instances` table.
 * @class
 */
function Instance() {
  Model.call(this, 'instances', 'id');
}
util.inherits(Instance, Model);

/**
 * Associates a volume with an instance.
 * @param {string} instance_id Id of the instance.
 * @param {string} volume_id   Id of the volume.
 * @return {knex~promise} A knex promise for the query.
 */
Instance.prototype.addVolume = function (instance_id, volume_id) {
  return this.db('instance_volumes').insert({
    instance_id: instance_id,
    volume_id: volume_id
  });
};

/**
 * Disassociates a volume with an instance.
 * @param {string} instance_id Id of the instance.
 * @param {string} volume_id   Id of the volume.
 * @return {knex~promise} A knex promise for the query.
 */
Instance.prototype.removeVolume = function (instance_id, volume_id) {
  return this.db('instance_volumes').where({
    instance_id: instance_id,
    volume_id: volume_id
  }).del();
};

/**
 * Determines a list of volumes associated with the instance.
 * @param {string} instance_id Id of the instance.
 * @return {knex~promise} A knex promise for the query.
 */
Instance.prototype.getVolumes = function (instance_id) {
  return volume.select()
    .innerJoin('instance_volumes', 'instance_volumes.volume_id', 'volumes.id')
    .where({
      'instance_volumes.instance_id': instance_id
    });
};

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Instance();
