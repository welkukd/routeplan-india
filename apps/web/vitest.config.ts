import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@routeplan/db": resolve(__dirname, "../../packages/db/src"),
      "@routeplan/whatsapp": resolve(__dirname, "../../packages/whatsapp/src"),
      "@routeplan/routing": resolve(__dirname, "../../packages/routing/src"),
      "@routeplan/payments": resolve(__dirname, "../../packages/payments/src"),
      "@routeplan/ui": resolve(__dirname, "../../packages/ui/src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    clearMocks: true,
  },
});
