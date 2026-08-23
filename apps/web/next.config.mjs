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
};

export default nextConfig;