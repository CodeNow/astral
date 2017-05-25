#!/bin/bash

DOCK_INIT_SCRIPT=/opt/runnable/dock-init/init.sh

# Set the hostname for consul
CONSUL_HOSTNAME={{consul_hostname}}
export CONSUL_HOSTNAME

USER_VAULT_HOSTNAME={{user_vault_load_balancer}}
export USER_VAULT_HOSTNAME

# Initialize the dock
bash $DOCK_INIT_SCRIPT >> /var/log/user-script-dock-init.log 2>&1
