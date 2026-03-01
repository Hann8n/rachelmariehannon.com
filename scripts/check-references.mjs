import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const htmlFiles = ["index.html", "admin/index.html"];
const attrRegex = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

function normalizeLocalRef(ref) {
  if (!ref || ref.startsWith("http://") || ref.startsWith("https://")) return null;
  if (ref.startsWith("mailto:") || ref.startsWith("tel:") || ref.startsWith("#")) return null;
  if (!ref.startsWith("/")) return null;
  const withoutHash = ref.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  return withoutQuery.replace(/^\/+/, "");
}

function collectMissingRefs(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  attrRegex.lastIndex = 0;
  const missing = [];
  let match;
  while ((match = attrRegex.exec(source)) !== null) {
    const rawRef = match[1];
    const localRef = normalizeLocalRef(rawRef);
    if (!localRef) continue;

    const absoluteRef = path.join(repoRoot, localRef);
    if (!fs.existsSync(absoluteRef)) {
      missing.push({ from: filePath, ref: rawRef });
    }
  }
  return missing;
}

const missingRefs = htmlFiles.flatMap((relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  return collectMissingRefs(absolutePath);
});

if (!missingRefs.length) {
  console.log("Reference check passed: no missing local src/href files.");
  process.exit(0);
}

console.error("Reference check failed. Missing local references:");
for (const item of missingRefs) {
  console.error(`- ${item.from}: ${item.ref}`);
}
process.exit(1);
