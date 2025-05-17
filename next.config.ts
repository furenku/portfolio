import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  eslint: {
    // ignoreDuringBuilds: true,    
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'media.rodrigofrenk.dev',
      },
    ]
    
  },
};

 
const withNextIntl = createNextIntlPlugin();
 
export default withNextIntl(nextConfig);