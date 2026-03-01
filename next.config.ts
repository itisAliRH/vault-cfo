import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: projectRoot },
  webpack: (config) => {
    // Lock context and resolution to vaultcfo so tailwindcss and other deps
    // resolve from vaultcfo/node_modules, not a parent (e.g. /Users/alireza).
    config.context = projectRoot;
    config.resolve = config.resolve ?? {};
    config.resolve.modules = [
      path.join(projectRoot, "node_modules"),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : []),
    ];
    return config;
  },
};

export default nextConfig;
