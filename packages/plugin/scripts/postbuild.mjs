import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("./dist");

await mkdir(distDir, { recursive: true });

const pkg = {
  name: "prosemirror-completion",
  version: "0.0.0",
  type: "module",
  main: "./index.cjs",
  module: "./index.mjs",
  types: "./index.d.ts",
  exports: {
    ".": {
      types: "./index.d.ts",
      import: "./index.mjs",
      require: "./index.cjs",
    },
    "./types": {
      types: "./types.d.ts",
      default: "./types.js",
    },
  },
};

await writeFile(path.join(distDir, "package.json"), JSON.stringify(pkg, null, 2));
