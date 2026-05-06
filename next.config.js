/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Faster builds: skip source maps in production
  productionBrowserSourceMaps: false,
  /**
   * Webpack dev (plain `next dev`): on Windows the server runtime can `require("./230.js")`
   * while files live under `./chunks/`. Forcing async chunk paths under `chunks/` aligns
   * `__webpack_require__.u` with emitted files. Turbopack (`next dev --turbo`) avoids this path.
   */
  webpack: (config, { dev, isServer }) => {
    // `next dev --turbo` sets TURBOPACK; webpack hook is unused then (avoids Turbopack warnings).
    if (process.env.TURBOPACK) return config;
    if (dev) {
      config.cache = false;
      if ("parallelism" in config) config.parallelism = 1;
    }
    /**
     * Webpack-only dev (`next dev` without Turbopack): nested `app/.../page.js` bundles can
     * `require("./230.js")` while the chunk lives under `.next/server/chunks/`. Pin async
     * chunks under `chunks/` so runtime paths line up (Windows + stale `.next` makes this worse).
     */
    if (dev && isServer && config.output) {
      config.output.chunkFilename = "chunks/[id].js";
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

if (process.argv.some((a) => a === "dev") && !process.argv.includes("--turbo")) {
  // eslint-disable-next-line no-console -- dev-only hint
  console.warn(
    "\n\x1b[33m[next]\x1b[0m Webpack dev on Windows often hits MODULE_NOT_FOUND for server chunks (e.g. ./230.js).\n" +
      "  \x1b[1mPrefer:\x1b[0m  npm run dev  (Turbopack). If you must use Webpack:  npm run dev:clean:webpack\n"
  );
}

module.exports = nextConfig;
