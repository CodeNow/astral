#!/bin/bash

# Write the profile environment variables
PROFILE_FILE=/etc/profile.d/runnable-host-tags.sh
echo '#!/bin/sh' >> $PROFILE_FILE
echo 'export HOST_TAGS={{host_tags}}' >> $PROFILE_FILE
echo 'export FILIBUSTER_VERSION={{filibuster_version}}' >> $PROFILE_FILE
echo 'export KRAIN_VERSION={{krain_version}}' >> $PROFILE_FILE
echo 'export SAURON_VERSION={{sauron_version}}' >> $PROFILE_FILE
echo 'export IMAGE_BUILDER_VERSION={{image_builder_version}}' >> $PROFILE_FILE
echo 'export DOCKER_LISTENER_VERSION={{docker_listener_version}}' >> $PROFILE_FILE

# Attempt to initialize the dock
timeout=1
while true
do
  bash /opt/runnable/dock-init.sh
  if [[ $? == 0 ]]
  then
    break
  fi

  # TODO report failure

  sleep $timeout
  timeout=$(( timeout * 2 ))
done
