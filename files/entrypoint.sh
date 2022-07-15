#!/bin/bash
cp -r /app/volume/* /app/workdir/
/app/workdir/run.sh | tee output.log
mkdir /app/volume/output
cp /app/workdir/results.xml /app/volume/output/
cp /app/workdir/output.log /app/volume/output/
if [[ -d /app/workdir/screenshots/ ]]
then
   mv /app/workdir/screenshots/ /app/volume/output/
fi

