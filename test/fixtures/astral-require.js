'use strict';

/**
 * Specialized require (relative to the astral library root). Requires that the
 * `process.env.ASTRAL_ROOT` variable is set (this is done by the NPM scripts).
 * @module astral:test:common:fixtures
 */
module.exports = function astralRequire(path) {
  return require([process.env.ASTRAL_ROOT, path].join(''));
};
