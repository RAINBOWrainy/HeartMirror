/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static export for CI - API routes don't work in static export mode
  // Tauri desktop app uses Rust backend directly, not Next.js API
  // output: 'export',
  // distDir: 'out',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
