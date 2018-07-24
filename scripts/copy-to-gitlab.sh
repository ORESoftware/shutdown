#!/usr/bin/env bash

set -e;

root="$HOME/WebstormProjects/oresoftware/dell-xps-backup"

cd "$root";

git rm -rf "$root/WebstormProjects" || { echo "Could not remove folder."; };

rm -rf "$root/WebstormProjects"

mkdir -p "$root/WebstormProjects"

rsync -r --exclude=".git" --exclude="node_modules" "$HOME/WebstormProjects/" "$root/WebstormProjects/"

hg add
hg commit -m "auto-commit"
hg push ssh://hg@bitbucket.org/OREsoftware/dell-xps-backup
