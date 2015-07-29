'use strict';

var util = require('util');
var ErrorCat = require('error-cat');
var log = require('./logger');

/**
 * Custom ErrorCat error handler.
 * @class
 */
function Error() {
  ErrorCat.apply(this, arguments);
}
util.inherits(Error, ErrorCat);

/**
 * Logs errors via default shiva logger.
 * @param {error} err Error to log.
 * @see error-cat
 */
Error.prototype.log = function (err) {
  log.error(err);
};

/**
 * Error handling via error-cat.
 * @module shiva:error
 * @author Ryan Sandor Richards
 */
module.exports = new Error();
