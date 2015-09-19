'use strict';

var util = require('util');
var Model = require('./model');
var knex = require('knex');

/**
 * Model for handling the `instances` table.
 * @class
 */
function Instance() {
  Model.call(this, 'instances', 'id');
}
util.inherits(Instance, Model);

/**
 * Model for handling instances for the database.
 * @author Ryan Sandor Richards
 * @module shiva:models
 */
module.exports = new Instance();

/**
 * Mark single instance as deleted (set `deleted` column to the `now`)
 * if it wasn't deleted before.
 *
 * @example
 * instance.markAsDeleted('some-instance-id', function (err) {
 *   // Err will be populated if you made a mistake in your data...
 * });
 *
 * @param {string} id Primary key id for the row to update.
 * @return {knex~promise} A promise for the update query.
 */
Instance.prototype.markAsDeleted = function(id) {
  return this.db(this.table)
          .where(this._wherePrimaryEq(id))
          .whereNotNull('deleted')
          .update({ deleted: knex.raw('now()') });
};
