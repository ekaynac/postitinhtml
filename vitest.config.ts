import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["**/*.dom.test.{ts,tsx}", "jsdom"]],
    coverage: { provider: "v8", include: ["packages/*/src/**/*.{ts,tsx}"] },
  },
});
