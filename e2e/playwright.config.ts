import { defineConfig } from "@playwright/test";

// Wrangler dev serves at http://localhost:8787 by default.
// The vanilla example is served via `npx serve --single` at port 3000.
export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  // baseURL is the static file server root.
  // The vanilla example is at /examples/vanilla/ and the core bundle at /packages/core/dist/.
  use: { baseURL: "http://localhost:3000" },
  webServer: [
    {
      // Self-hosted Yjs sync server (Cloudflare Workers + Durable Objects via wrangler).
      // Route: /parties/main/:room (handled by routePartykitRequest + "Main" DO binding).
      command: "npx wrangler dev --port 8787",
      url: "http://localhost:8787",
      reuseExistingServer: !process.env.CI,
      cwd: "../packages/server",
      // wrangler's first run compiles via esbuild and boots workerd, which can
      // exceed 30s cold; give it generous headroom so startup doesn't flake.
      timeout: 120_000,
      stderr: "pipe",
      stdout: "pipe",
    },
    {
      // Static file server rooted at the monorepo root.
      // index.html uses root-relative /packages/core/dist/index.global.js so the
      // server must serve from the project root, not examples/vanilla/ alone.
      command: "npx serve -l 3000 .",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      cwd: "..",
      timeout: 30_000,
    },
  ],
});
