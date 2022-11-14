#!/bin/bash
echo ""
echo "Test script:"
cat test.spec.js
echo ""
echo ""
yarn playwright test test.spec.js --project=firefox
