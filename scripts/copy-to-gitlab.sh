#!/usr/bin/env bash

set -e;

mkdir -p "$HOME/oresoftware_backups";

root="$HOME/oresoftware_backups/dell-xps-backup"

cd "$root";

mkdir -p "$root/WebstormProjects"

rsync -r --checksum --exclude=".git" --exclude="node_modules" "$HOME/WebstormProjects/" "$root/WebstormProjects/"

hg add
hg commit -m "auto-commit"
hg push ssh://hg@bitbucket.org/OREsoftware/dell-xps-backup
