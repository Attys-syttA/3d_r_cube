import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const inventoryPath = join(root, "repo-file-inventory.json");
const mode = process.argv.includes("--write") ? "write" : "check";
const excludedDirs = new Set([".git", "node_modules", "dist", "build", "coverage", ".cache", ".serena", "test-results"]);
const excludedFiles = new Set(["repo-file-inventory.json"]);

function classify(path) {
  if (path.startsWith(".github/")) return "ci";
  if (path.startsWith("docs/")) return "documentation";
  if (path.startsWith("scripts/")) return "tooling";
  if (path.startsWith("src/")) return "source";
  if (path.startsWith("public/")) return "public-asset";
  if (path.startsWith("tests/")) return "test";
  if (["AGENTS.md", "STATE.md", "README.md"].includes(path)) return "project-memory";
  if (path.startsWith(".")) return "repo-config";
  return "repo-root";
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) {
        walk(join(dir, entry.name), files);
      }
      continue;
    }
    if (entry.isFile()) {
      const rel = relative(root, join(dir, entry.name)).replaceAll("\\", "/");
      if (!excludedFiles.has(rel)) {
        files.push(rel);
      }
    }
  }
  return files;
}

function buildInventory() {
  const files = walk(root).sort().map((path) => {
    const fullPath = join(root, path);
    const bytes = readFileSync(fullPath);
    return {
      path,
      role: classify(path),
      bytes: statSync(fullPath).size,
      sha256: createHash("sha256").update(bytes).digest("hex")
    };
  });

  return {
    schemaVersion: 1,
    generatedBy: "scripts/check-inventory.mjs",
    root: "3d_r_cube",
    files
  };
}

const next = buildInventory();
const serialized = `${JSON.stringify(next, null, 2)}\n`;

if (mode === "write") {
  writeFileSync(inventoryPath, serialized, "utf8");
  console.log(`inventory written: ${next.files.length} files`);
  process.exit(0);
}

if (!existsSync(inventoryPath)) {
  console.error("repo-file-inventory.json is missing; run npm.cmd run inventory:write");
  process.exit(1);
}

const current = readFileSync(inventoryPath, "utf8");
if (current !== serialized) {
  console.error("repo-file-inventory.json is out of date; run npm.cmd run inventory:write");
  process.exit(1);
}

console.log(`inventory check passed: ${next.files.length} files`);
