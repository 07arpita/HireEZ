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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push({
        "bufferutil": "commonjs bufferutil",
        "utf-8-validate": "commonjs utf-8-validate",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
