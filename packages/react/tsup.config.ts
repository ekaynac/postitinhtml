import { defineConfig } from "tsup";

// Ship compiled JS + .d.ts so consumers (e.g. a Vite JS app like the teklif
// portal) can import @postits/react without a TSX toolchain. react and the
// core are kept external (peer deps the host app provides).
export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "@postits/core"],
});
