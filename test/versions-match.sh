#!/bin/bash

# Path to your Dockerfile and package.json
DOCKERFILE_PATH="./Dockerfile"
PACKAGE_JSON_PATH="./files/package.json"

# Extract version from Dockerfile
DOCKERFILE_VERSION=$(grep '^FROM' $DOCKERFILE_PATH | awk -F':' '{print $2}' | sed 's/-noble//' | sed 's/v//')

# Extract version from package.json
PACKAGE_JSON_VERSION=$(awk -F'"' '/@playwright\/test/ {print $4}' $PACKAGE_JSON_PATH)

# Compare versions
if [ "$DOCKERFILE_VERSION" = "$PACKAGE_JSON_VERSION" ]; then
    echo "Versions match: $DOCKERFILE_VERSION"
else
    echo "Versions do not match. Dockerfile version: $DOCKERFILE_VERSION, package.json version: $PACKAGE_JSON_VERSION"
    # Exit with error
    exit 1
fi
