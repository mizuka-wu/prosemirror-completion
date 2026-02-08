import { writeFile, mkdir, readFile, copyFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("./dist");
const rootDir = path.resolve("../..");

await mkdir(distDir, { recursive: true });

const rootPkgPath = path.resolve("./package.json");
const rootPkg = JSON.parse(await readFile(rootPkgPath, "utf-8"));

const pkg = {
  name: "prosemirror-completion",
  version: rootPkg.version,
  description: "Copilot-style text completion plugin for ProseMirror",
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
  keywords: [
    "prosemirror",
    "completion",
    "copilot",
    "ghost-text",
    "editor",
    "ai",
    "llm",
    "suggestion"
  ],
  author: "ProseMirror Completion Contributors",
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/mizuka-wu/prosemirror-completion.git"
  },
  homepage: "https://mizuka-wu.github.io/prosemirror-completion/",
  bugs: {
    url: "https://github.com/mizuka-wu/prosemirror-completion/issues"
  },
  peerDependencies: {
    "prosemirror-model": rootPkg.peerDependencies?.["prosemirror-model"] ?? "^1.19.4",
    "prosemirror-state": rootPkg.peerDependencies?.["prosemirror-state"] ?? "^1.4.3",
    "prosemirror-transform": rootPkg.peerDependencies?.["prosemirror-transform"] ?? "^1.7.3",
    "prosemirror-view": rootPkg.peerDependencies?.["prosemirror-view"] ?? "^1.33.3",
  },
};

await writeFile(path.join(distDir, "package.json"), JSON.stringify(pkg, null, 2));

// Copy README and LICENSE to dist
try {
  await copyFile(path.join(rootDir, "README.md"), path.join(distDir, "README.md"));
  console.log("Copied README.md to dist");
} catch (err) {
  console.warn("Failed to copy README.md:", err.message);
}

try {
  await copyFile(path.join(rootDir, "LICENSE"), path.join(distDir, "LICENSE"));
  console.log("Copied LICENSE to dist");
} catch (err) {
  console.warn("Failed to copy LICENSE:", err.message);
}
