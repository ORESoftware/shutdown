#!/usr/bin/env bash

set -e;

rm -rf "$HOME/Dropbox/webstorm_projects_ubuntu_xps/";

rsync -r --exclude=node_modules "$HOME/WebstormProjects" "$HOME/Dropbox/webstorm_projects_ubuntu_xps/"
