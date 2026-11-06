#!/bin/bash

# Read the file and replace the devDependencies section
sed -i 's/"devDependencies": {/"devDependencies": {\n    "@playwright\/test": "^1.63.0",/' package.json

