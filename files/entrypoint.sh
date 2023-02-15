#!/bin/bash
cp -r /app/volume/* /app/workdir/
## log playwright version
echo "$(cat /app/workdir/package.json | grep -oEi '@playwright/test\": \"([0-9.]+)\"')"
/app/workdir/run.sh | tee output.log
mkdir -p /app/volume/output
cp /app/workdir/results.xml /app/volume/output/ || true
cp /app/workdir/output.log /app/volume/output/ || true

mkdir -p /app/volume/output/screenshots/
mkdir -p /app/volume/output/traces/

## move screenshots
if [[ -d /app/workdir/screenshots/ ]]
then
  [ "$(ls -A /app/workdir/screenshots)" ] && mv /app/workdir/screenshots/* /app/volume/output/screenshots/
fi

## move traces
if [[ -d /app/workdir/test-results/ ]]
then
  [ "$(ls -A /app/workdir/test-results)" ] && mv /app/workdir/test-results/* /app/volume/output/traces/
fi

chmod -Rf 777 /app/volume/output || true
