#!/bin/bash

ENV_FILE=/etc/environment
HOST_TAGS_FILE=/opt/runnable/host_tags
DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh

# Set preferred versions of each of the dock services
echo 'FILIBUSTER_VERSION={{filibuster_version}}' >> $ENV_FILE
echo 'KRAIN_VERSION={{krain_version}}' >> $ENV_FILE
echo 'SAURON_VERSION={{sauron_version}}' >> $ENV_FILE
echo 'IMAGE_BUILDER_VERSION={{image_builder_version}}' >> $ENV_FILE
echo 'DOCKER_LISTENER_VERSION={{docker_listener_version}}' >> $ENV_FILE

# Set the host tags file (used by upstart for docker-listener)
echo '{{host_tags}}' > $HOST_TAGS_FILE

# Initialize the dock
bash $DOCK_INIT_SCRIPT
