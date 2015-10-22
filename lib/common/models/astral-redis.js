'use strict';

var Promise = require('bluebird');
var redis = require('redis');

/**
 * Redis Client.
 */
Promise.promisifyAll(redis.RedisClient.prototype);
var redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

/**
 * Utility model for interacting with redis.
 * @module astral:common:models
 */
module.exports = class AstralRedis {
  /**
   * @return The redis client.
   */
  static getClient() {
    return redisClient;
  }

  /**
   * Gets a github org id from a given owner name.
   * @param {string} name Name of the organization.
   * @return {Promise} A promise that resolves with the org if (if availbale).
   */
  static getGitHubOrgId (name) {
    return redisClient.hgetAsync(
      process.env.REDIS_GITHUB_OWNER_ID_HASH,
      name
    );
  }

  /**
   * Sets a github id for the given organization name.
   * @param {string} name Name of the organization.
   * @return {Promise} A promise that resolves with the id has been set.
   */
  static setGitHubOrgId (name, id) {
    return redisClient.hsetAsync(
      process.env.REDIS_GITHUB_OWNER_ID_HASH,
      name,
      parseInt(id)
    ).then(function () {
      return id;
    });
  }
};
