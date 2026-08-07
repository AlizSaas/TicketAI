import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Set the dynamic stale time to 30 seconds
    },
  },
  serverExternalPackages: [
    "@opentelemetry/instrumentation-winston",
    "@opentelemetry/winston-transport",
    "@opentelemetry/auto-instrumentations-node",
  ],
};

export default nextConfig;
