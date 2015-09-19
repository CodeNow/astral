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


Instance.prototype.markAsDeleted = function(id) {
  return this.db(this.table)
          .where(this._wherePrimaryEq(id))
          .whereNotNull('deleted')
          .update({ deleted: knex.raw('now()') });
};
