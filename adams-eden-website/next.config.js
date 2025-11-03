/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
  },
  // Avoid inlining environment variables here when not needed. NEXT_PUBLIC_* will be exposed
  // automatically on the client when accessed via process.env at build time, and server-only
  // secrets (like STRIPE_SECRET_KEY, NOAA_TOKEN) should be read at runtime in server code only.
}

module.exports = nextConfig
