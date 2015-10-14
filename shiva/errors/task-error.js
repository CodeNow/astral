'use strict';

var util = require('util');
var defaults = require('101/defaults');
var isObject = require('101/is-object');

/**
 * Error type for task rejection promises that indicated to the worker that
 * something went wrong, but that it should attempt the task again. Useful for
 * handling any sort of issue that may have a temporal component (network
 * connectivity, etc.)
 * @class
 * @param {string} task Name of the task that encountered the error.
 * @param {string} message Message for the task error.
 * @param {object} [data] Extra data to include with the error, optional.
 */
function TaskError(task, message, data) {
  Error.call(this);
  this.setMessageAndData(task, message, data);
}
util.inherits(TaskError, Error);

/**
 * Sets the message and data for the error. This abstraction makes it easy to
 * test that subclasses are being initialized correctly.
 * @param {string} task Name of the task that encountered the error.
 * @param {string} message Message for the task error.
 * @param {object} [data] Extra data to include with the error, optional.
 */
TaskError.prototype.setMessageAndData = function (task, message, data) {
  this.message = task + ': ' + message;
  var errorData = { task: task };
  if (isObject(data)) {
    defaults(errorData, data);
  }
  this.data = errorData;
};

/**
 * Normal error for tasks that indicates the job should be tried again.
 * @author Ryan Sandor Richards
 * @module shiva:errors
 */
module.exports = TaskError;