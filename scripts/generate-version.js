#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get build metadata
const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = require(packageJsonPath);
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
const outputPath = path.join(projectRoot, 'lib', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(versionData, null, 2) + '\n');

console.log(`Generated version.json:`, versionData);
