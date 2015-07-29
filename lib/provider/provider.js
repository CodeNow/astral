'use strict';

/**
 * Abstract provider adapter base class. This class defines the default
 * behaviors needed by shiva for each cloud provider.
 * @author Ryan Sandor Richards
 * @module shiva:providers
 */
module.exports = Provider;

/**
 * Creates a new provider adapter instance.
 * @class
 */
function Provider() {
}

/**
 * Valid instance types for the provider.
 * @type Array
 */
Provider.VALID_INSTANCE_TYPES = ['run', 'build', 'services'];

/**
 * Determines if the given instance type is valid.
 * @param {string} type Instance type to test.
 * @return {boolean} `true` if the type is valid, `false` otherwise.
 */
Provider.prototype.isValidType = function (type) {
  if (~Provider.VALID_INSTANCE_TYPES.indexOf(type) === 0) {
    return false;
  }
  return true;
};

/**
 * Creates a new instance of the given type on the cloud provider.
 * @param {string} type Type of instance to create, can be: run, build, or
 *   services.
 * @param {function} cb Callback to execute once the instance has been created.
 */
Provider.prototype.create = function (type, cb) {
  cb(new Error('Provider.create: not implemented'));
};

/**
 * Removes an instance from the cloud provider.
 * @param {string} id Id of the instance to remove.
 * @param {function} cb Callback to execute once the instance has been removed.
 */
Provider.prototype.remove = function (id, cb) {
  cb(new Error('Provider.remove: not implemented'));
};

/**
 * Starts an instance on the cloud provider.
 * @param {string} id Id of the instance to start.
 * @param {function} cb Callback to execute once the instance has been started.
 */
Provider.prototype.start = function (id, cb) {
  cb(new Error('Provider.start: not implemented'));
};

/**
 * Stops an instance on the cloud provider.
 * @param {string} id Id of the instance to stop.
 * @param {function} cb Callback to execute once the instance has been stopped.
 */
Provider.prototype.stop = function (id, cb) {
  cb(new Error('Provider.stop: not implemented'));
};

/**
 * Fetches provider specific information for a given instance.
 * @param {string} id Id of the instance for which to fetch information.
 * @param {function} cb Callback for the yielded information.
 */
Provider.prototype.info = function (id, cb) {
  cb(new Error('Provider.info: not implemented'));
};
