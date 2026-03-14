import type { NextConfig } from "next";

/**
 * ChunkLoadError prevention: chunkLoadTimeout for slower dev environments.
 * Keep all webpack overrides here — do not split across multiple files.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, _context) => {
    config.output ??= {};
    config.output.chunkLoadTimeout = 30000;
    return config;
  },
};

export default nextConfig;
