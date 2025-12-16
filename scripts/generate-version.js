#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get build metadata
const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = require(packageJsonPath);
const baseVersion = packageJson.version; // e.g., "1.0"
const buildDate = new Date().toISOString();
const outputPath = path.join(projectRoot, 'lib', 'version.json');

let buildNumber = process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER;

// If no CI build number, generate a local sequential one
if (!buildNumber) {
  try {
    const existingVersion = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    buildNumber = existingVersion.buildNumber + 1;
  } catch {
    buildNumber = 1;
  }
}

buildNumber = parseInt(buildNumber);

// Create full version with patch number as build number
// Extract major.minor from package.json and add buildNumber as patch
const versionParts = baseVersion.split('.');
const majorMinor = versionParts.slice(0, 2).join('.');
const fullVersion = `${majorMinor}.${buildNumber}`;

// Create version data
const versionData = {
  version: fullVersion,
  buildDate,
  buildNumber
};

// Write to lib/version.json
fs.writeFileSync(outputPath, JSON.stringify(versionData, null, 2) + '\n');

console.log(`Generated version.json:`, versionData);
