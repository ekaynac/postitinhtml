import { defineConfig } from "tsup";

export default defineConfig([
  { entry: ["src/index.ts"], format: ["esm", "cjs"], dts: true, clean: true },
  { entry: { index: "src/iife.ts" }, format: ["iife"], outExtension: () => ({ js: ".global.js" }), minify: true },
]);
