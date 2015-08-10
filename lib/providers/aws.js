'use strict';

var util = require('util');
var Promise = require('bluebird');
var isNumber = require('101/is-number');
var defaults = require('101/defaults');
var EC2 = require('aws-sdk').EC2;
var Provider = require('./provider');
var error = require('../error');

/**
 * Class for provisioning cluster infrastructure using Amazon Web Services.
 * @class
 */
function AWSProvider() {
  Provider.call(this);
  this.ec2 = new EC2({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  this.runInstances = Promise.promisify(this.ec2.runInstances);
  this.waitFor = Promise.promisify(this.ec2.waitFor);
}
util.inherits(AWSProvider, Provider);

/**
 * AWS provider interface.
 * @author Ryan Sandor Richards
 * @module shiva:providers
 */
module.exports = new AWSProvider();

/**
 * Deploys a set of instances for a cluster of the given type. This method will
 * attempt to deploy a set of instances of the given type on EC2 and accept when
 * all instances are running.
 * @param {object} cluster Cluster information from the database.
 * @param {string} type Type of instances to run.
 * @param {number} [count] Number of instances to run.
 * @return {Promise} A promise that resolves when all ec2 instances have
 *   started.
 */
AWSProvider.prototype.createInstances = function (cluster, type, number) {
  var params = {
    KeyName: cluster.ssh_key_name,
    SecurityGroupIds: [ cluster.security_group_id ],
    SubnetId: cluster.subnet_id
  };

  if (isNumber(number)) {
    params.MinCount = number;
    params.MaxCount = number;
  }

  defaults(params, this.getDefaultInstanceParams(type));

  return this.runInstances(params)
    .then(function (data) {
      return data.Instances;
    });
};

/**
 * Determines the default parameters for an instance of the given type.
 * @param {string} type Type of the instance.
 * @return {object} The default parameters for the instance.
 */
AWSProvider.prototype.getDefaultInstanceParams = function(type) {
  var prefix = this.getTypeEnvironmentPrefix(type);
  return {
    ImageId: process.env[prefix + 'INSTANCE_AMI_ID'],
    MinCount: process.env[prefix + 'INSTANCE_MIN_COUNT'],
    MaxCount: process.env[prefix + 'INSTANCE_MAX_COUNT'],
    InstanceType: process.env[prefix + 'INSTANCE_TYPE'],
    Placement: {
      AvailabilityZone: process.env.AWS_AVAILABILITY_ZONE,
      GroupName: process.env.AWS_GROUP_NAME
    },
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/sdb',
        Ebs: {
          VolumeSize: 1000,
          DeleteOnTermination: true
        }
      },
      {
        DeviceName: '/dev/sdc',
        Ebs: {
          VolumeSize: 50,
          DeleteOnTermination: true
        }
      },
      {
        DeviceName: '/dev/sdd',
        Ebs: {
          VolumeSize: 50,
          DeleteOnTermination: true
        }
      }
    ]
  };
};
