'use strict';

var Provider = require('./provider');

/**
 * Defines methods of obtaining a provider for handling shiva server requests.
 * @author Ryan Sandor Richards
 * @module shiva:providers
 */
module.exports = {
  getProvider: getProvider
};

/**
 * Determines a provider to use for server actions. Currently we only support
 * AWS as a cloud provider, so this method simply returns a new AWS provider
 * instance. In the future it will change depending on which cloud provider is
 * the best for Runnable.
 * @return A cloud provider adapter to use for performing provisioning actions.
 */
function getProvider() {
  return new Provider();
}
