import type { NextConfig } from "next";

/**
 * ChunkLoadError prevention: chunkLoadTimeout for slower dev environments.
 * Keep all webpack overrides here — do not split across multiple files.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  webpack: (config, _context) => {
    config.output ??= {};
    config.output.chunkLoadTimeout = 30000;
    return config;
  },
};

export default nextConfig;
