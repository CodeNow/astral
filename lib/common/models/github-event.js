'use strict';

var castDatabaseError = require('./util').castDatabaseError;
var db = require('../database');
var isObject = require('101/is-object');
var Promise = require('bluebird');
// var keypath = require('keypather');

/**
 * Name of the table used to store github events.
 * @type {string}
 */
const GITHUB_EVENTS_TABLE = 'github_events';

/**
 * Model for storing and retrieving github webhook events from the database.
 * @author Ryan Sandor Richards
 * @class
 * @module astral:common:models
 */
module.exports = class GitHubEvent {
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
  static _getGitHubOrgFromPayload(/*payload*/) {
    // TODO Find the correct github_org_id from the payload
    // var githubId = keypath(payload, 'repository.owner.id');
    return Promise.resolve('146579');
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
    row.payload = GitHubEvent._filterPayloadFields(
      row.payload,
      GitHubEvent._githubURLFilter
    );
    row.payload = JSON.stringify(row.payload);
    row.recorded_at = new Date(row.recorded_at * 1000);

    return GitHubEvent._getGitHubOrgFromPayload(row.payload)
      .then(function (githubOrgId) {
        row.github_org_id = parseInt(githubOrgId);
        return db(GITHUB_EVENTS_TABLE).insert(row);
      })
      .catch(castDatabaseError);

  }
};
