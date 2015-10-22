'use strict';

var AstralGitHub = require('./astral-github');
var AstralRedis = require('./astral-redis');
var castDatabaseError = require('./util').castDatabaseError;
var clone = require('101/clone');
var db = require('../database');
var exists = require('101/exists');
var isObject = require('101/is-object');
var keypath = require('keypather')();
var NoGithubOrgError = require('../errors/no-github-org-error');
var Promise = require('bluebird');

/**
 * Name of the table used to store github events.
 * @type {string}
 */
const GITHUB_EVENTS_TABLE = 'github_events';

/**
 * Select Query Builder.
 * @type {QueryBuilder}
 */
var SELECT_QUERY_BUILDER = db(GITHUB_EVENTS_TABLE);

/**
 * Model for storing and retrieving github webhook events from the database.
 * @author Ryan Sandor Richards
 * @class
 * @module astral:common:models
 */
module.exports = class GitHubEvent {
  /**
   * @return The knex SELECT query builder for the `github_events` table.
   */
  static _getSelectQueryBuilder() {
    return SELECT_QUERY_BUILDER;
  }

  /**
   * Filters keys that match common GitHub url key format for webhook event
   * payloads.
   * @param {string} key Key of the object to filter.
   * @return {boolean} `true` if the key should be kept, `false` otherwise.
   */
  static _githubURLFilter (key) {
    return !key.match(/_url$/);
  }

  /**
   * Filters overly verbose fields from github webhooks event payloads.
   * @param {object} payload The github webhooks payload.
   * @param {function} filterFn Function that accepts a given key and value
   *   in the payload. Should return true if the field should be kept, false
   *   otherwise.
   * @return A filtered payload.
   */
  static _filterPayloadFields (payload, filterFn) {
    var result = {};
    Object.keys(payload).forEach(function (key) {
      var value = payload[key];
      if (!filterFn(key, value)) {
        return;
      }
      if (isObject(value)) {
        result[key] = GitHubEvent._filterPayloadFields(value, filterFn);
      }
      else {
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Determine's the github organization id from a given payload. This will
   * first attempt to grab the id directly from the payload. If the id is not
   * available it will then ask our vpc redis cache. Finally if the user id is
   * not in redis, we will fetch and cache the id from the github api.
   * @param {object} payload GitHub webhook payload for the event.
   * @return {Promise} A promise that resolves with the github organization id.
   */
  static _getGitHubOrgFromPayload (payload) {
    return Promise.try(function () {
      // `membership` payloads have `organization.id`
      if (keypath.has(payload, 'organization.id')) {
        return parseInt(keypath.get(payload, 'organization.id'));
      }

      // Ensure we can get the owner name (everything else should have this)
      var ownerName = keypath.get(payload, 'repository.owner.name') ||
        keypath.get(payload, 'repository.owner.login');
      if (!exists(ownerName)) {
        throw new NoGithubOrgError(
          'Payload missing `repository.owner.name`' +
          'or `repository.owner.login`'
        );
      }

      // Attempt to get the id from redis
      return AstralRedis.getGitHubOrgId(ownerName)
        .then(function (cachedOrgId) {
          // It was in the cache, and there was much rejoicing!
          if (exists(cachedOrgId)) {
            return cachedOrgId;
          }

          // For most payloads we can get it from `repository.owner.id`
          var orgId = parseInt(keypath.get(payload, 'repository.owner.id'));
          if (orgId) {
            return AstralRedis.setGitHubOrgId(ownerName, orgId);
          }
          // `push` event types don't have this, time to grab it from github
          else {
            return AstralGitHub.showAsync(ownerName)
              .then(function (org) {
                return AstralRedis.setGitHubOrgId(ownerName, org.id);
              });
          }
        });
    });
  }

  /**
   * Inserts a new github event into the database.
   * @param row The row to insert.
   * @param row.delivery_id The given webhook delivery id.
   * @param row.type The type of the event.
   * @param row.payload The webhook payload.
   * @param row.recorded_at The timestamp when the event was recorded.
   */
  static insert (row) {
    var insertRow = clone(row);

    insertRow.payload = GitHubEvent._filterPayloadFields(
      row.payload,
      GitHubEvent._githubURLFilter
    );

    insertRow.payload = JSON.stringify(row.payload);
    insertRow.recorded_at = new Date(row.recorded_at * 1000);

    return GitHubEvent._getGitHubOrgFromPayload(row.payload)
      .then(function (githubOrgId) {
        insertRow.github_org_id = parseInt(githubOrgId);
        return GitHubEvent._getSelectQueryBuilder().insert(insertRow);
      })
      .catch(castDatabaseError);
  }
};
