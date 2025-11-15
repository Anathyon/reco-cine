import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  images: {
    domains: ['image.tmdb.org', 'cdn.myanimelist.net'],
  },
};

export default nextConfig;