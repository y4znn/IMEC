import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sources',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
