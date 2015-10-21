'use strict';

var castDatabaseError = require('./util').castDatabaseError;
var db = require('../database');
var isObject = require('101/is-object');

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
    return db(GITHUB_EVENTS_TABLE).insert(row).catch(castDatabaseError);
  }
};
