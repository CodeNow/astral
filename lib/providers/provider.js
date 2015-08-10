'use strict';

/**
 * Base provider class for shiva.
 * @author Ryan Sandor Richards
 * @module shiva:providers
 */
module.exports = Provider;

/**
 * Abstract base provider class for shiva. This defines the behaviors needed
 * to perform provisioning tasks on any given provider.
 * @class
 */
function Provider() {
}

/**
 * Determines if the given instance type is valid.
 * @param {string} type Name of the type to check.
 * @return {boolean} `true` if the given type is valid, `false` otherwise.
 */
Provider.prototype.isValidInstanceType = function (type) {
  return type === 'build' || type === 'run';
};

/**
 * Determines the environment variable name prefix for instances of the given
 * type.
 * @param {string} type The type of the instance.
 * @return {string}
 */
Provider.prototype.getTypeEnvironmentPrefix = function (type) {
  if (type === 'build') {
    return 'BUILD_';
  }
  else if (type === 'run') {
    return 'RUN_';
  }
  return null;
};

/**
 * Creates instances for a cluster on the provider.
 * @param {object} cluster Cluster information from the database.
 * @param {string} type Type of instances to run.
 * @param {number} [count] Number of instances to run.
 * @return {Promise} A promise that resolves when all instances have started.
 */
Provider.prototype.createInstances = function (cluster, type, number) {
  throw new Error('Provider.createInstances is abstract.');
};
