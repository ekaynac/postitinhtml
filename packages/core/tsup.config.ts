import { defineConfig } from "tsup";

export default defineConfig([
  { entry: ["src/index.ts"], format: ["esm", "cjs"], dts: true, clean: true },
  { entry: ["src/index.ts"], format: ["iife"], globalName: "Postits", outExtension: () => ({ js: ".global.js" }), minify: true },
]);
