// Offline sanity check for the static site (no network, no dependencies).
//  - every local href/src in every HTML file resolves to a file in the repo
//  - inline <script> blocks and app.js parse as JavaScript
//  - worker/worker.js parses as an ES module
// Usage: node scripts/check-site.mjs
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import vm from "node:vm";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const SKIP = new Set([".git", "node_modules", ".wrangler"]);
const errors = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const htmlFiles = walk(root).filter((f) => f.endsWith(".html"));
const attrRe = /\b(?:href|src)\s*=\s*"([^"]*)"/gi;
const inlineRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;

for (const file of htmlFiles) {
  const rel = relative(root, file);
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(attrRe)) {
    const ref = m[1].trim();
    if (!ref || /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(ref)) continue;
    const path = ref.split("#")[0].split("?")[0];
    if (!path) continue;
    const target = path.startsWith("/") ? join(root, path) : resolve(dirname(file), path);
    if (!existsSync(target)) errors.push(`${rel}: broken local reference "${ref}"`);
  }
  for (const m of html.matchAll(inlineRe)) {
    if (/type\s*=\s*"(?!module|text\/javascript)/i.test(m[1])) continue; // json, templates
    if (!m[2].trim()) continue;
    try { new vm.Script(m[2], { filename: rel }); }
    catch (e) { errors.push(`${rel}: inline script syntax error: ${e.message}`); }
  }
}

for (const js of ["app.js"]) {
  try { new vm.Script(readFileSync(join(root, js), "utf8"), { filename: js }); }
  catch (e) { errors.push(`${js}: syntax error: ${e.message}`); }
}

// worker.js is an ES module: node --check it via a .mjs copy so it is parsed as a module.
const tmp = mkdtempSync(join(tmpdir(), "ferpa-check-"));
const copy = join(tmp, "worker.mjs");
writeFileSync(copy, readFileSync(join(root, "worker/worker.js")));
try { execFileSync(process.execPath, ["--check", copy], { stdio: "pipe" }); }
catch (e) { errors.push(`worker/worker.js: syntax error: ${e.stderr}`); }

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`ok: ${htmlFiles.length} html files, app.js, worker/worker.js`);
