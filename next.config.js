/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Faster builds: skip source maps in production
  productionBrowserSourceMaps: false,
  /**
   * Windows dev: filesystem webpack cache can get out of sync and cause
   * `/_next/static/chunks/*.js` 404s + missing vendor-chunks. Memory cache avoids stale paths.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
