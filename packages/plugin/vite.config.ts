import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "node:path";

const externals = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-transform",
  "prosemirror-view",
];

const globals = {
  "prosemirror-model": "ProseMirrorModel",
  "prosemirror-state": "ProseMirrorState",
  "prosemirror-transform": "ProseMirrorTransform",
  "prosemirror-view": "ProseMirrorView",
};

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ProseMirrorCompletion",
    },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: externals,
      output: [
        {
          format: "es",
          entryFileNames: "index.mjs",
          exports: "named",
        },
        {
          format: "cjs",
          entryFileNames: "index.cjs",
          exports: "named",
        },
        {
          format: "umd",
          entryFileNames: "index.umd.js",
          name: "ProseMirrorCompletion",
          exports: "named",
          globals,
        },
        {
          format: "iife",
          entryFileNames: "index.iife.js",
          name: "ProseMirrorCompletion",
          exports: "named",
          globals,
        },
      ],
    },
    outDir: "dist",
  },
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
      outDir: "dist",
    }),
  ],
});
