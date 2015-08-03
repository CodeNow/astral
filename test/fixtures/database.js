'use strict';

var debug = require('debug')('shiva:test:fixtures');
var db = require('database');
var foreignKeys = require('./foreign-keys');

/**
 * Helpers for setting up the database during functional tests.
 * @author Ryan Sandor Richards
 * @module shiva:test:fixtures
 */
module.exports = {
  truncate: truncate
};

/**
 * Truncates all tables in the database.
 * @param cb Callback to execute after each table has been truncated.
 */
function truncate(cb) {
  foreignKeys.remove().then(function () {
    return db('clusters').truncate();
  }).then(function () {
    return db('instances').truncate();
  }).then(function () {
    return db('volumes').truncate();
  }).then(function () {
    return db('instance_volumes').truncate();
  }).then(function () {
    return foreignKeys.add();
  }).asCallback(cb);
}
