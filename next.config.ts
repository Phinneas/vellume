import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    // Ignore TypeScript errors from VellumeApp and api directories
    // These are separate projects with their own tsconfig
    ignoreBuildErrors: false,
  },
  // Exclude VellumeApp and api from the build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/VellumeApp/**', '**/api/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
