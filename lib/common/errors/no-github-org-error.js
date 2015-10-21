'use strict';

var AstralError = require('./astral-error');

/**
 * Error that is thrown when a github organization could not be determined from
 * given data.
 * @module astral:common:errors
 */
module.exports = class NoGithubOrgError extends AstralError {
  constructor (msg) {
    super(msg);
  }
};
