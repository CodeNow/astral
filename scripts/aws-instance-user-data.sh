#!/bin/bash

ENV_FILE=/opt/runnable/env
HOST_TAGS_FILE=/opt/runnable/host_tags
DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh

# Set preferred versions of each of the dock services
echo 'export FILIBUSTER_VERSION={{filibuster_version}}' >> $ENV_FILE
echo 'export KRAIN_VERSION={{krain_version}}' >> $ENV_FILE
echo 'export SAURON_VERSION={{sauron_version}}' >> $ENV_FILE
echo 'export IMAGE_BUILDER_VERSION={{image_builder_version}}' >> $ENV_FILE
echo 'export DOCKER_LISTENER_VERSION={{docker_listener_version}}' >> $ENV_FILE

# Set the host tags file (used by upstart for docker-listener)
echo '{{host_tags}}' > $HOST_TAGS_FILE

# Initialize the dock
bash $DOCK_INIT_SCRIPT
