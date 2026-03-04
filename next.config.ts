import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/maps',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
