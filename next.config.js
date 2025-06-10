/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/vapi/:path*',
       
        destination: 'https://api.vapi.ai/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
