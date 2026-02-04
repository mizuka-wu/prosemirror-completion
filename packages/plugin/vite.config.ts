import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "node:path";

const externals = [
  "prosemirror-model",
  "prosemirror-state",
  "prosemirror-transform",
  "prosemirror-view",
];

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ProseMirrorCompletion",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: externals,
      output: {
        exports: "named",
      },
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
