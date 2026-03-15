/** @type {import('next').NextConfig} */
/* global module, process */
const nextConfig = {
  env: {
    BUILD_VERSION: process.env.BUILD_VERSION || "1.0.0",
    BUILD_TIME: process.env.BUILD_TIME || new Date().toISOString(),
  },
  productionBrowserSourceMaps: process.env.PLAYWRIGHT_COVERAGE === "true",
};

module.exports = nextConfig;
