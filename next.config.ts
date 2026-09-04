import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
  sassOptions: {
    silenceDeprecations: ['import'],
  },
};

export default nextConfig;
