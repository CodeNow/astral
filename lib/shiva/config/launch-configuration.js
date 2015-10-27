'use strict';

/**
 * Default options for LaunchConfiguration aws requests.
 * @module astral:shiva:config
 */
module.exports = {
  /**
   * Default AWS SDK options for creating launch configurations.
   * @type {object}
   */
  create: {
    AssociatePublicIpAddress: false,
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/sdb',
        Ebs: {
          DeleteOnTermination: true,
          SnapshotId: process.env.AWS_SDB_SNAPSHOT_ID,
          VolumeSize: process.env.AWS_SDB_VOLUME_SIZE,
          VolumeType: 'gp2'
        }
      },
      {
        DeviceName: '/dev/sdc',
        Ebs: {
          DeleteOnTermination: true,
          SnapshotId: process.env.AWS_SDC_SNAPSHOT_ID,
          VolumeSize: process.env.AWS_SDC_VOLUME_SIZE,
          VolumeType: 'gp2'
        }
      },
      {
        DeviceName: '/dev/sdd',
        Ebs: {
          DeleteOnTermination: true,
          SnapshotId: process.env.AWS_SDD_SNAPSHOT_ID,
          VolumeSize: process.env.AWS_SDD_VOLUME_SIZE,
          VolumeType: 'gp2'
        }
      }
    ],
    ImageId: process.env.AWS_INSTANCE_IMAGE_ID,
    InstanceType: process.env.AWS_INSTANCE_TYPE,
    KeyName: process.env.AWS_SSH_KEY_NAME,
    PlacementTenancy: 'default',
    SecurityGroups: [
      process.env.AWS_BASTION_SECURITY_GROUP,
      process.env.AWS_CLUSTER_SECURITY_GROUP_ID
    ]
  }
};
