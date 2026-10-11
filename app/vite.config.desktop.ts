import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Not part of the Build 1 Android pipeline (that's vite.config.ts / npm run
// build, unaffected by this file). This produces one self-contained
// index.html — all JS/CSS inlined, no separate asset files, no server
// needed — so it can be opened directly from Finder on a Mac, the way v1's
// web/index.html worked. Kept outside the normal build so it never runs by
// accident via `npm run build` or the Android CI workflow.
export default defineConfig({
  plugins: [preact(), viteSingleFile()],
  build: {
    outDir: "dist-desktop",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
