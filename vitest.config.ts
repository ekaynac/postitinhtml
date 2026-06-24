import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Unit/integration tests live under packages/. The e2e/ dir holds Playwright
    // specs (its own runner) which must not be collected by Vitest.
    include: ["packages/**/*.{test,spec}.{ts,tsx}"],
    environmentMatchGlobs: [["**/*.dom.test.{ts,tsx}", "jsdom"]],
    coverage: { provider: "v8", include: ["packages/*/src/**/*.{ts,tsx}"] },
  },
});
