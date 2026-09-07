// FULLY CORRECTED repo-wide audit: parse each @arcevo/facet-* package's ACTUAL exports
// (using a careful parser), then verify EVERY named import in src/ against the real
// export set. Reports every mismatch with the correct suggested source.
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

const PKGS = [
  { pkg: "@arcevo/facet-components", dir: "node_modules/@arcevo/facet-components/dist" },
  { pkg: "@arcevo/facet-auth", dir: "node_modules/@arcevo/facet-auth/dist" },
  { pkg: "@arcevo/facet-sdk", dir: "node_modules/@arcevo/facet-sdk/dist" },
  { pkg: "@arcevo/facet-store", dir: "node_modules/@arcevo/facet-store/dist" },
  { pkg: "@arcevo/facet-layout", dir: "node_modules/@arcevo/facet-layout/dist" },
];

// Build export-name set for a package's main entry (index.d.ts).
function buildExports(pkgDir) {
  const full = path.join(ROOT, pkgDir);
  if (!fs.existsSync(full)) return { ok: false, names: new Set(), note: "dir missing" };
  // find the main index d.ts
  const idxFile = ["index.d.ts", "facet-auth.d.ts", "facet-sdk.d.ts", "facet-store.d.ts", "facet-layout.d.ts"]
    .map(f => path.join(full, f)).find(f => fs.existsSync(f));
  let files = [];
  if (idxFile) files.push(idxFile);
  // also include any *.d.ts directly in dir (subpath types)
  const sub = { icons: "icons.d.ts" };
  let blob = idxFile ? fs.readFileSync(idxFile, "utf8") : "";
  // if main file re-exports subpaths via `export * from "./icons"`, read those too
  for (const [name, f] of Object.entries(sub)) {
    const p = path.join(full, f);
    if (fs.existsSync(p)) {
      const c = fs.readFileSync(p, "utf8");
      if (/export\s*\*/.test(c)) blob += "\n" + c; // lucide re-export
    }
  }
  const names = new Set();
  const re = /export\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(blob)) !== null) {
    for (const tok of m[1].split(",")) {
      let t = tok.trim().replace(/^type\s+/, "");
      if (!t) continue;
      const a = t.match(/^(.+?)\s+as\s+(.+)$/);
      if (a) names.add(a[2].trim());
      else { const w = t.replace(/[:,].*$/, "").trim(); if (w) names.add(w); }
    }
  }
  return { ok: true, names, note: idxFile ? path.basename(idxFile) : "no index" };
}

const expMap = {};
for (const p of PKGS) {
  const res = buildExports(p.dir);
  if (!res.ok) { expMap[p.pkg] = null; console.log(`WARN: ${p.pkg} -> ${res.note}`); continue; }
  expMap[p.pkg] = res.names;
  console.log(`${p.pkg}: ${res.names.size} exports (from ${res.note})`);
}

// icons subpath = re-export of lucide-react. Build set of lucide names too.
let lrBlob = "";
try {
  const lrIdx = path.join(ROOT, "node_modules/lucide-react/dist/lucide-react.d.ts");
  if (fs.existsSync(lrIdx)) lrBlob = fs.readFileSync(lrIdx, "utf8");
} catch (e) {}
const lrNames = new Set();
const lre = /export\s*\{([^}]*)\}/g;
let lm;
while ((lm = lre.exec(lrBlob)) !== null) {
  for (const tok of lm[1].split(",")) {
    let t = tok.trim().replace(/^type\s+/, "");
    if (!t) continue;
    const a = t.match(/^(.+?)\s+as\s+(.+)$/);
    if (a) lrNames.add(a[2].trim());
    else { const w = t.replace(/[:,].*$/, "").trim(); if (w) lrNames.add(w); }
  }
}
console.log(`lucide-react: ${lrNames.size} exports parsed`);

// Walk src/, collect every `import { a, b as c } from "@arcevo/facet-X"` (incl. subpaths).
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
const importRE = /import\s*(?:type\s*)?\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;

console.log("\n=== MISMATCHES (imported name not actually exported by source pkg) ===\n");
let totalMismatches = 0;
const summary = {};
for (const full of walk(path.join(ROOT, "src"))) {
  const rel = path.relative(ROOT + "/src", full).replace(/\\/g, "/");
  const c = fs.readFileSync(full, "utf8");
  const lines = c.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let m;
    const re = new RegExp(importRE.source, "g");
    while ((m = re.exec(lines[i])) !== null) {
      const spec = m[2];
      const pm = spec.match(facetPkgRe);
      if (!pm) continue;
      const pkg = `@arcevo/${pm[1]}`;
      const sub = pm[2]; // e.g. "icons"
      const raw = m[1].split(",");
      for (const tok of raw) {
        let t = tok.trim().replace(/^type\s+/, "");
        if (!t) continue;
        const a = t.match(/^(.+?)\s+as\s+(.+)$/);
        const localName = a ? a[2].trim() : t.replace(/[:,].*$/, "").trim();
        if (!localName) continue;
        // Determine the set to check
        let set, srcLabel;
        if (pkg === "@arcevo/facet-components" && sub === "icons") {
          set = lrNames; srcLabel = "@arcevo/facet-components/icons (->lucide-react)";
        } else {
          set = expMap[pkg]; srcLabel = pkg + (sub ? "/" + sub : "");
        }
        if (!set) {
          console.log(`  ${rel}:${i+1} | ${localName} <- ${srcLabel} | PKG NOT FOUND`);
          totalMismatches++;
          summary[pkg] = (summary[pkg]||0)+1;
          continue;
        }
        if (!set.has(localName)) {
          // Suggest correct source
          let suggestion = "";
          if (pkg === "@arcevo/facet-components") {
            if (lrNames.has(localName)) suggestion = "lucide-react (or @arcevo/facet-components/icons)";
            else if (lrNames.has(localName.replace(/Icon$/,""))) suggestion = "~ maybe lucide base name; check";
            else suggestion = "NOT resolvable from facet or lucide";
          }
          console.log(`  ${rel}:${i+1} | ${localName} <- ${srcLabel} | NOT EXPORTED${suggestion ? " -> "+suggestion : ""}`);
          totalMismatches++;
          summary[pkg] = (summary[pkg]||0)+1;
        }
      }
    }
  }
}
console.log(`\nTotal mismatches: ${totalMismatches}`);
for (const k in summary) console.log(`  ${k}: ${summary[k]}`);
