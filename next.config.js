/** @type {import('next').NextConfig} */
/* global module, process */
const nextConfig = {
  productionBrowserSourceMaps: process.env.GENERATE_SOURCE_MAPS === "true",
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "session-combat.fly.dev" }],
        destination: "https://dnd.dougis.com/:path*",
        permanent: true,
      },
    ];
  },
  env: {
    BUILD_VERSION: process.env.BUILD_VERSION || "1.0.0",
    BUILD_TIME: process.env.BUILD_TIME || new Date().toISOString(),
  },
};

module.exports = nextConfig;
