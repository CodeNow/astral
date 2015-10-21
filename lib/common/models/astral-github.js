var Promise = require('bluebird');
var GitHubApi = require('github-api');

/**
 * Astral GitHub User API client.
 * @type {GitHubApi}
 */
module.exports = Promise.promisifyAll(
  new GitHubApi({ type: 'oauth', token: process.env.GITHUB_TOKEN }).getUser()
);
