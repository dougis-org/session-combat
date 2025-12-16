#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get build metadata
const packageJson = require('../package.json');
const version = packageJson.version;
const buildDate = new Date().toISOString();
const buildNumber = process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER || '0';

// Create version data
const versionData = {
  version,
  buildDate,
  buildNumber: parseInt(buildNumber)
};

// Write to lib/version.json
const outputPath = path.join(__dirname, '../lib/version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionData, null, 2) + '\n');

console.log(`Generated version.json:`, versionData);
