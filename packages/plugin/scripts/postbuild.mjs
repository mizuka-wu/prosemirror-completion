import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("./dist");

await mkdir(distDir, { recursive: true });

const rootPkgPath = path.resolve("./package.json");
const rootPkg = JSON.parse(await readFile(rootPkgPath, "utf-8"));

const pkg = {
  name: "prosemirror-completion",
  version: rootPkg.version,
  type: "module",
  main: "./index.cjs",
  module: "./index.mjs",
  types: "./index.d.ts",
  sideEffects: false,
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
  peerDependencies: {
    "prosemirror-model": rootPkg.peerDependencies?.["prosemirror-model"] ?? "^1.19.4",
    "prosemirror-state": rootPkg.peerDependencies?.["prosemirror-state"] ?? "^1.4.3",
    "prosemirror-transform": rootPkg.peerDependencies?.["prosemirror-transform"] ?? "^1.7.3",
    "prosemirror-view": rootPkg.peerDependencies?.["prosemirror-view"] ?? "^1.33.3",
  },
};

await writeFile(path.join(distDir, "package.json"), JSON.stringify(pkg, null, 2));
