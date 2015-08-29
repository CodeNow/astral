'use strict';

var util = require('util');
var Model = require('./model');

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
