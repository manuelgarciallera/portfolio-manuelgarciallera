import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([
  ".git",
  ".next",
  ".data",
  "build",
  "dist",
  "node_modules",
  "coverage",
  "storybook-static",
]);
const checkedExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);

const suspiciousChars = new Map([
  ["\u00c3", "Latin-1 mojibake prefix U+00C3"],
  ["\u00c2", "Latin-1 mojibake prefix U+00C2"],
  ["\u00e2", "UTF-8 punctuation mojibake prefix U+00E2"],
  ["\ufffd", "Unicode replacement character"],
]);

const hits = [];

function shouldCheck(filePath) {
  return checkedExtensions.has(path.extname(filePath));
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (!shouldCheck(filePath)) continue;

    const text = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(root, filePath);

    text.split(/\r?\n/).forEach((line, index) => {
      for (const [char, reason] of suspiciousChars) {
        if (line.includes(char)) {
          hits.push({
            file: relativePath,
            line: index + 1,
            reason,
            sample: line.trim().slice(0, 160),
          });
        }
      }
    });
  }
}

walk(root);

if (hits.length > 0) {
  console.error("Potential mojibake/encoding problems found:\n");
  for (const hit of hits) {
    console.error(`${hit.file}:${hit.line} - ${hit.reason}`);
    console.error(`  ${hit.sample}`);
  }
  process.exit(1);
}

console.log("Encoding check passed: no mojibake markers found.");
