import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 experimental:{
    staleTimes:{
      dynamic: 30  // Set the dynamic stale time to 30 seconds
    }
  },
};

export default nextConfig;
