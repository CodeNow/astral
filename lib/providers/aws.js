'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var Mustache = require('mustache');
var Promise = require('bluebird');
var isNumber = require('101/is-number');
var defaults = require('101/defaults');
var AWS = require('aws-sdk');
var EC2 = AWS.EC2;

var error = require('../error');
var log = require('../logger').child({ module: 'aws' });

/**
 * AWS provider interface.
 * @author Ryan Sandor Richards
 * @module shiva:providers
 */
module.exports = new AWSProvider();

/**
 * Class for provisioning cluster infrastructure using Amazon Web Services.
 * @class
 */
function AWSProvider() {
  this.ec2 = new EC2({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  var templatePath = path.resolve(
    __dirname,
    '../../scripts/aws-instance-user-data.sh'
  );
  this.userDataTemplate = fs.readFileSync(templatePath).toString();
}

/**
 * Deploys a set of instances for a cluster of the given type. This method will
 * attempt to deploy a set of instances of the given type on EC2 and accept when
 * all instances are running.
 * @param {object} cluster Cluster information from the database.
 * @param {number} [count] Number of instances to run.
 * @return {Promise} A promise that resolves when all ec2 instances have
 *   started.
 */
AWSProvider.prototype.createInstances = function (cluster, number) {
  var params = {
    UserData: new Buffer(
      this.getUserDataScript(cluster)
    ).toString('base64')
  };

  if (isNumber(number)) {
    params.MinCount = number;
    params.MaxCount = number;
  }

  defaults(params, this.getDefaultInstanceParams());

  log.debug({ params: params }, 'EC2 `runInstances`');

  var self = this;
  return new Promise(function (resolve, reject) {
    self.ec2.runInstances(params, function (err, data) {
      if (err) { return reject(err); }
      resolve(data.Instances);
    });
  });
};

/**
 * Generates the user data script to run during instance startup.
 *
 * The script the script sets a `HOST_TAGS` environment variable as a comma
 * separated list containing the instance type and the cluster id (org). This
 * variable is used during docker startup to associate the dock with a given
 * customer organization when the dock is discovered by mavis.
 *
 * @param {object} cluster Cluster for the script.
 * @return {string} The UserData script for the instance.
 */
AWSProvider.prototype.getUserDataScript = function (cluster) {
  return Mustache.render(this.userDataTemplate, {
    host_tags: [cluster.github_id, 'run', 'build'].join(','),
    filibuster_version: process.env.FILIBUSTER_VERSION,
    krain_version: process.env.KRAIN_VERSION,
    sauron_version: process.env.SAURON_VERSION,
    image_builder_version: process.env.IMAGE_BUILDER_VERSION,
    docker_listener_version: process.env.DOCKER_LISTENER_VERSION
  });
};

/**
 * Promisified aws EC2 `waitFor` method.
 * @param {string} type The type of event to wait for.
 * @param {object} params The waitFor conditions.
 * @return {Promise} A promise for the waitFor action.
 */
AWSProvider.prototype.waitFor = function (type, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.ec2.waitFor(type, params, function (err, data) {
      if (err) { reject(err); }
      resolve(data);
    });
  });
};

/**
 * Promisified ec2 `terminateInstances` method.
 * @param {object} params Paramters for the instance termination method.
 * @param {array} param.InstanceIds Ids of the instances to terminate.
 * @return {Promise} A promise for the terminateInstances method.
 */
AWSProvider.prototype.terminateInstances = function (params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.ec2.terminateInstances(params, function (err, data) {
      if (err) { reject(err); }
      resolve(data);
    });
  });
};

/**
 * Promisified ec2 `createTags` method.
 * @example
 * // Tag some instances
 * aws.createTags({
 *   Resources: ['id'],
 *   Tags: [
 *     { Key: 'keyname', Value: 'thevalue' }, ...
 *   ]
 * }).then(...).catch(...);
 *
 * @param {object} params Parameters for the createTags method.
 * @param {array} params.Resources Ids of the resources to tag.
 * @param {array} params.Tags Tags to apply the resource.
 */
AWSProvider.prototype.createTags = function (params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.ec2.createTags(params, function (err, data) {
      if (err) { reject(err); }
      resolve(data);
    });
  });
};

/**
 * Determines the default parameters for an instance.
 * @return {object} The default parameters for the instance.
 */
AWSProvider.prototype.getDefaultInstanceParams = function () {
  return {
    KeyName: process.env.AWS_SSH_KEY_NAME,
    SecurityGroupIds: [
      process.env.AWS_BASTION_SECURITY_GROUP,
      process.env.AWS_CLUSTER_SECURITY_GROUP_ID
    ],
    SubnetId: process.env.AWS_CLUSTER_SUBNET,
    ImageId: process.env.AWS_INSTANCE_IMAGE_ID,
    MinCount: 1,
    MaxCount: 1,
    InstanceType: process.env.AWS_INSTANCE_TYPE,
    InstanceInitiatedShutdownBehavior: process.env.AWS_SHUTDOWN_BEHAVIOR
  };
};
