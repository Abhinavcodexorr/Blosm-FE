/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Faster builds: skip source maps in production
  productionBrowserSourceMaps: false,
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
