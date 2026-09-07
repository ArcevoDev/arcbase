// Authoritative type-level export sets (d.ts, careful parser) for each facet pkg.
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

function parseDtsExports(content) {
  const names = new Set();
  if (!content) return names;
  const re = /export\s*\{([\s\S]*?)\}\s*(?:from\s*["'][^"']+["'])?/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    for (const tok of m[1].split(",")) {
      let t = tok.trim().replace(/^type\s+/, "").trim();
      if (!t) continue;
      const asMatch = t.match(/^(.+?)\s+as\s+(.+)$/);
      const local = asMatch ? asMatch[2].trim() : t.replace(/\s.*/, "").trim();
      if (local) names.add(local);
    }
  }
  // also `export { default }` etc. -> "default"
  return names;
}

const pkgs = [
  { pkg: "@arcevo/facet-components", dir: "node_modules/@arcevo/facet-components/dist/index.d.ts" },
  { pkg: "@arcevo/facet-auth",        dir: "node_modules/@arcevo/facet-auth/dist/index.d.ts" },
  { pkg: "@arcevo/facet-sdk",         dir: "node_modules/@arcevo/facet-sdk/dist/index.d.ts" },
  { pkg: "@arcevo/facet-store",       dir: "node_modules/@arcevo/facet-store/dist/index.d.ts" },
  { pkg: "@arcevo/facet-layout",      dir: "node_modules/@arcevo/facet-layout/dist/index.d.ts" },
];

for (const { pkg, dir } of pkgs) {
  const full = path.join(ROOT, dir);
  let content = "";
  let note = "";
  try { content = fs.readFileSync(full, "utf8"); note = path.basename(dir); } catch (e) {
    // try alternative names
    const alts = ["dist/index.d.ts", "dist/facet.d.ts"];
    for (const a of alts) {
      try { content = fs.readFileSync(path.join(ROOT, "node_modules/" + pkg.split("/")[1] + "/" + a), "utf8"); note = a; break; } catch {}
    }
  }
  const names = parseDtsExports(content);
  console.log("\n=== " + pkg + " (" + names.size + " type-exports, from " + note + ") ===");
  console.log(Array.from(names).sort().join(" | "));
}
