import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,

  // Login do Firebase servido pelo próprio domínio do site (ver authDomain em
  // src/lib/firebase.ts). Sem isso, navegadores que isolam cookies de terceiros
  // (Brave, Firefox, Safari, Chrome com bloqueio) perdem a sessão ao voltar do Google.
  async rewrites() {
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!project) return [];
    const origin = `https://${project}.firebaseapp.com`;
    return [{ source: '/__/auth/:path*', destination: `${origin}/__/auth/:path*` }];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }],
      },
    ];
  },
};

export default nextConfig;
