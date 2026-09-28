import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Canonical root .env loader for Next.js
const projectDir = path.resolve(__dirname, "..");
loadEnvConfig(projectDir);

// Prevent frontend Next.js from adopting backend's PORT (3001) from root .env
if (process.env.PORT === '3001') {
  process.env.PORT = '3000';
}

const nextConfig: NextConfig = {
  async rewrites() {
    // In local development, proxy to localhost:3001 if backend runs separately.
    // In unified production (e.g. Vercel), Vercel routes /api/* directly to the NestJS serverless function.
    const isVercel = Boolean(process.env.VERCEL);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!isVercel && apiUrl && apiUrl.startsWith('http') && !apiUrl.includes('localhost:3000')) {
      return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
    }

    if (!isVercel && process.env.NODE_ENV !== 'production') {
      return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }];
    }

    return [];
  },
};

export default nextConfig;
