#!/bin/bash
if ! command -v sonar &> /dev/null; then
  exit 0
fi
sonar hook claude-post-tool-use --project 'SonarCloud-Demos_jimhalkyard-kudos'
