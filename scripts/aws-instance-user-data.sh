#!/bin/bash

ENV_FILE=/opt/runnable/env
HOST_TAGS_FILE=/opt/runnable/host_tags
NODE_ENV_FILE=/opt/runnable/node_env
DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh
REDIS_PORT_PATH=/opt/runnable/redis_port
REDIS_IPADDRESS_PATH=/opt/runnable/redis_ipaddress
RABBITMQ_HOSTNAME_PATH=/opt/runnable/rabbitmq_hostname
RABBITMQ_PORT_PATH=/opt/runnable/rabbitmq_port
RABBITMQ_USERNAME_PATH=/opt/runnable/rabbitmq_username
RABBITMQ_PASSWORD_PATH=/opt/runnable/rabbitmq_password

# Set preferred versions of each of the dock services
echo 'export FILIBUSTER_VERSION={{filibuster_version}}' >> $ENV_FILE
echo 'export KRAIN_VERSION={{krain_version}}' >> $ENV_FILE
echo 'export SAURON_VERSION={{sauron_version}}' >> $ENV_FILE
echo 'export IMAGE_BUILDER_VERSION={{image_builder_version}}' >> $ENV_FILE
echo 'export DOCKER_LISTENER_VERSION={{docker_listener_version}}' >> $ENV_FILE

# Set the host tags file (used by upstart for docker-listener)
echo '{{host_tags}}' > $HOST_TAGS_FILE

# Set the node environment file
echo '{{node_env}}' > $NODE_ENV_FILE

# Set the redis port and ip address files
echo '{{redis_port}}' > $REDIS_PORT_PATH
echo '{{redis_ipaddress}}' > $REDIS_IPADDRESS_PATH

# Set the rabbitmq environment files
echo '{{rabbitmq_hostname}}' > $RABBITMQ_HOSTNAME_PATH
echo '{{rabbitmq_port}}' > $RABBITMQ_PORT_PATH
echo '{{rabbitmq_username}}' > $RABBITMQ_USERNAME_PATH
echo '{{rabbitmq_password}}' > $RABBITMQ_PASSWORD_PATH

# Initialize the dock
bash $DOCK_INIT_SCRIPT
