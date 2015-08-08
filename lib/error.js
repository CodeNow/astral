'use strict';

var util = require('util');
var ErrorCat = require('error-cat');
var Promise = require('bluebird');
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
 * Creates an error then returns a rejection promise containing the error.
 * @param {number} code Status code for the error.
 * @param {string} message Message for the error.
 * @param {object} data Additional data for the error.
 * @return {Promise} A rejection promise containing the error.
 */
Error.prototype.reject = function (code, message, data) {
  return Promise.reject(this.create(code, message, data));
};

/**
 * Creates and reports an error, then returns a rejection promise containing
 * the wrapped error.
 * @param {number} code Status code for the error.
 * @param {string} message Message for the error.
 * @param {object} data Additional data for the error.
 * @return {Promise} A rejection promise containing the error.
 */
Error.prototype.rejectAndReport = function (code, message, data) {
  return Promise.reject(this.createAndReport(code, message, data));
}

/**
 * Error handling via error-cat.
 * @module shiva:error
 * @author Ryan Sandor Richards
 */
module.exports = new Error();
