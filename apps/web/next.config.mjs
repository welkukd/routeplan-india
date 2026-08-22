/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@routeplan/db",
    "@routeplan/whatsapp",
    "@routeplan/routing",
    "@routeplan/payments",
    "@routeplan/ui",
  ],
  experimental: {
    turbo: {
      resolveAlias: {
        "@routeplan/db": "../../packages/db/src",
        "@routeplan/whatsapp": "../../packages/whatsapp/src",
        "@routeplan/routing": "../../packages/routing/src",
        "@routeplan/payments": "../../packages/payments/src",
        "@routeplan/ui": "../../packages/ui/src",
      },
    },
  },
};

module.exports = nextConfig;