'use strict';

var util = require('util');
var Model = require('./model');

/**
 * Model for handling the `volumes` table.
 * @class
 */
function Volume() {
  Model.call(this, 'volumes', 'id');
}
util.inherits(Volume, Model);

/**
 * Determines a list of all instances associated with this volume.
 * @param {string} volume_id Id of the volume.
 * @return {knex~promise} A promise for the query.
 */
Volume.prototype.getInstances = function (volume_id) {
  return this.db('instances').select().innerJoin(
    'instance_volumes',
    'instance_volumes.instance_id',
    'instances.id'
  ).where({
    'instance_volumes.volume_id': volume_id
  });
};

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Volume();
