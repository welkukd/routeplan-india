/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@routeplan/db",
    "@routeplan/whatsapp",
    "@routeplan/routing",
    "@routeplan/payments",
    "@routeplan/ui",
  ],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;