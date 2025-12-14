/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUILD_VERSION: process.env.BUILD_VERSION || '1.0.0',
    BUILD_TIME: process.env.BUILD_TIME || new Date().toISOString(),
  },
}

module.exports = nextConfig
