// 1) List ALL facet-auth / facet-sdk / facet-tokens imports in src (file, spec, subpath, names).
// 2) Verify specific symbols in facet-components exports and print cn's type signature.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

// ---- (1) facet-auth/sdk/tokens imports ----
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if ([".ts", ".tsx", ".css"].includes(path.extname(e.name))) out.push(full);
  }
  return out;
}

const facetPkgRe = /^@arcevo\/(facet-[a-z]+)(?:\/(.+))?$/;

console.log("=== ALL facet-auth / facet-sdk / facet-tokens / facet-layout imports in src/ ===");
for (const full of walk(path.join(ROOT, "src"))) {
  const ext = path.extname(full);
  const raw = fs.readFileSync(full, "utf8");
  const lines = raw.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    let m;
    // named
    const nre = /import\s*(?:type\s*)?\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
    while ((m = nre.exec(lines[i])) !== null) {
      const spec = m[2];
      const pm = spec.match(facetPkgRe);
      if (pm && ["facet-auth", "facet-sdk", "facet-tokens", "facet-layout", "facet-store"].includes(pm[1])) {
        const names = m[1].split(",").map(s => s.trim()).filter(Boolean)
          .map(s => { const c = s.replace(/^type\s+/, ""); const a = c.match(/^(.+?)\s+as\s+(.+)$/); return a ? a[2] : c.split(/\s/)[0]; }).filter(Boolean);
        console.log(`  ${path.relative(ROOT + "/src", full)}:${i+1} -> @arcevo/${pm[1]}${pm[2] ? "/" + pm[2] : ""} {${names.join(", ")}}`);
      }
    }
  }
}

// ---- (2) verify symbols ----
const idx = fs.readFileSync(path.join(ROOT, "node_modules/@arcevo/facet-components/dist/index.d.ts"), "utf8");
const re = /export\s*\{([^}]*)\}/g;
let s = ""; let x;
while ((x = re.exec(idx)) !== null) s += x[1] + ",";
const names = new Set(s.split(",").map(t => t.trim()).filter(Boolean).map(t => {
  const c = t.replace(/^type\s+/, "");
  const a = c.match(/^(.+?)\s+as\s+(.+)$/);
  return a ? a[2].trim() : c.split(/\s/)[0];
}).filter(Boolean));

console.log("\n=== facet-components export verification ===");
for (const n of ["cn", "Label", "InputGroup", "InputGroupAddon", "Textarea", "Button", "Input", "Separator", "Skeleton", "Command", "toggleVariants", "buttonVariants", "badgeVariants"]) {
  console.log(`  ${n}: ${names.has(n) ? "YES" : "NO"}`);
}

// cn type signature: find "declare const cn" or "function cn" or "cn:" in index.d.ts
const cnLine = idx.split(/\n/).find(l => /cn\b/.test(l) && /(Function|=>|:)/.test(l) && /from ['"]/.test(l) === false && l.length < 500);
// Also search for "cn:" typed import
const cnImport = idx.split(/\n/).find(l => /^import.*cn/.test(l) && l.length < 500);
console.log("\ncn-related lines (first 3, <500 chars):");
for (const l of [cnLine, cnImport].filter(Boolean).slice(0, 3)) console.log("  " + l.trim());

// Also print the icons.d.ts export line
const icons = fs.readFileSync(path.join(ROOT, "node_modules/@arcevo/facet-components/dist/icons.d.ts"), "utf8");
console.log("\n=== icons.d.ts content ===");
console.log(icons.trim());
