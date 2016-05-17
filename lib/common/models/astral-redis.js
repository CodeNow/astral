'use strict'

var fs = require('fs')
var Promise = require('bluebird')
var redis = require('redis')

let tlsOptions
if (process.env.REDIS_CACERT) {
  // ca is a string when encoding is passed into readFileSync
  const caString = fs.readFileSync(process.env.REDIS_CACERT, 'utf-8')
  tlsOptions = {
    rejectUnauthorized: true,
    ca: [ caString ]
  }
}

/**
 * Redis Client.
 */
Promise.promisifyAll(redis.RedisClient.prototype)
var redisOpts = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}
if (tlsOptions) {
  redisOpts.tls = tlsOptions
}
var redisClient = redis.createClient(redisOpts)

/**
 * Utility model for interacting with redis.
 * @module astral:common:models
 */
module.exports =
  class AstralRedis {
    /**
     * @return The redis client.
     */
    static getClient () {
      return redisClient
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
      )
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
        return id
      })
    }
}
