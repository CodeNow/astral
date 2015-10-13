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
  log.error({ err: err }, err.message);
};

/**
 * Logs a given error and returns a rejection promise for the error.
 * @param {Error} err Error to log.
 * @return {Promise} a rejection promise for the error.
 */
Error.prototype.reject = function (err) {
  this.log(err);
  return Promise.reject(err);
};

/**
 * Logs and reports an error via rollbar, then returns a rejection promise for
 * the error.
 * @param {Error} err Error to log and report.
 * @return {Promise} a rejection promise for the error.
 */
Error.prototype.rejectAndReport = function (err) {
  this.log(err);
  this.report(err);
  return Promise.reject(err);
};

/**
 * Error handling via error-cat.
 * @module shiva:error
 * @author Ryan Sandor Richards
 */
module.exports = new Error();
