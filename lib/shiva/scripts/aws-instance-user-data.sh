#!/bin/bash

DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh

# Set the hostname for consul
CONSUL_HOSTNAME={{consul_hostname}}
export CONSUL_HOSTNAME

# Initialize the dock
bash $DOCK_INIT_SCRIPT
