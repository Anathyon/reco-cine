import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  outputFileTracingRoot: __dirname,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/movies',
        destination: '/movies',
      },
      {
        source: '/series', 
        destination: '/series',
      },
      {
        source: '/animes',
        destination: '/animes', 
      },
      {
        source: '/search',
        destination: '/search',
      },
      {
        source: '/favorites',
        destination: '/favorites',
      },
    ];
  },
};

export default nextConfig;
