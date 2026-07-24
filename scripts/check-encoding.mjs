import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", "dist", "build", "coverage", ".cache", ".serena"]);
const textExtensions = new Set([
  ".css",
  ".gitattributes",
  ".gitignore",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".txt",
  ".yml"
]);

function extensionOf(path) {
  const match = path.match(/(\.[^.\\/]*)$/);
  return match ? match[1].toLowerCase() : "";
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(join(dir, entry.name), files);
      }
      continue;
    }
    if (entry.isFile()) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const failures = [];

for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const ext = extensionOf(file);
  const stat = statSync(file);
  if (stat.size === 0 || (!textExtensions.has(ext) && !["AGENTS.md", "README.md", "STATE.md"].includes(rel))) {
    continue;
  }
  const bytes = readFileSync(file);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    failures.push(`${rel}: UTF-8 BOM detected`);
  }
  const text = bytes.toString("utf8");
  if (text.includes("\r\n") && !rel.endsWith(".ps1") && !rel.endsWith(".bat") && !rel.endsWith(".cmd")) {
    failures.push(`${rel}: CRLF line endings detected`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("encoding check passed");
