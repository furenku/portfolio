import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  eslint: {
    // ignoreDuringBuilds: true,    
  },
  images: {
    domains: [
      'picsum.photos',
      'localhost'
    ],
    
  },
};

 
const withNextIntl = createNextIntlPlugin();
 
export default withNextIntl(nextConfig);