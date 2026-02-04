#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import inquirer from "inquirer";
import semver from "semver";

const rootDir = process.cwd();
const pluginPkgPath = path.join(rootDir, "packages/plugin/package.json");

const pluginPkg = JSON.parse(await readFile(pluginPkgPath, "utf-8"));
const currentVersion = pluginPkg.version ?? "0.0.0";

function formatChoice(type) {
  const next = semver.inc(currentVersion, type);
  return { name: `${type} (${next})`, value: next };
}

const { targetVersion } = await inquirer.prompt([
  {
    type: "list",
    name: "targetVersion",
    message: `Current version is ${currentVersion}. Choose release type:`,
    choices: [
      formatChoice("patch"),
      formatChoice("minor"),
      formatChoice("major"),
      { name: "custom", value: "custom" },
    ],
  },
]);

let finalVersion = targetVersion;

if (targetVersion === "custom") {
  const { customVersion } = await inquirer.prompt([
    {
      type: "input",
      name: "customVersion",
      message: "Enter custom version:",
      validate(input) {
        if (!semver.valid(input)) {
          return "Please enter a valid semver version";
        }
        if (semver.lte(input, currentVersion)) {
          return "Version must be greater than current version";
        }
        return true;
      },
    },
  ]);
  finalVersion = customVersion;
}

await inquirer.prompt([
  {
    type: "confirm",
    name: "confirm",
    message: `Release version ${finalVersion}?`,
    default: true,
  },
]).then((answer) => {
  if (!answer.confirm) {
    console.log("Release cancelled.");
    process.exit(0);
  }
});

pluginPkg.version = finalVersion;
await writeFile(pluginPkgPath, `${JSON.stringify(pluginPkg, null, 2)}\n`);
console.log(`\n✓ Updated plugin version to ${finalVersion}`);

try {
  console.log("\n> Updating lockfile (pnpm install --lockfile-only)...");
  execSync("pnpm install --lockfile-only", { stdio: "inherit" });
} catch (err) {
  console.error("Failed to update lockfile", err);
  process.exit(1);
}

try {
  console.log("\n> Building plugin...");
  execSync("pnpm --filter @prosemirror-completion/plugin build", {
    stdio: "inherit",
  });
} catch (err) {
  console.error("Build failed", err);
  process.exit(1);
}

const { shouldPublish } = await inquirer.prompt([
  {
    type: "confirm",
    name: "shouldPublish",
    message: "Publish to npm now?",
    default: false,
  },
]);

if (!shouldPublish) {
  console.log("\nRelease build complete. Skipping npm publish.");
  process.exit(0);
}

try {
  console.log("\n> Publishing to npm...");
  execSync("npm publish --access public", {
    cwd: path.join(rootDir, "packages/plugin/dist"),
    stdio: "inherit",
  });
  console.log("\n✓ Published prosemirror-completion@" + finalVersion);
} catch (err) {
  console.error("Publish failed", err);
  process.exit(1);
}
