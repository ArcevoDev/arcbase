// Definitive repo-wide audit: every @arcevo/facet-* import in src/ checked
// against the package's ACTUAL exports (careful d.ts parser + runtime require).
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

// ---- 1. GROUND-TRUTH export sets via runtime require (CJS) ----
function requireExportNames(specifier) {
  try {
    const m = require(specifier);
    return new Set(Object.keys(m));
  } catch (e) {
    return null;
  }
}

// d.ts parser (careful: handles `type `, `as`, aliases, multi-line braces)
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
  return names;
}

// facet-components main: try runtime require first (ground truth), else d.ts
let fcExports = requireExportNames("@arcevo/facet-components");
let fcSource = "runtime-require";
if (!fcExports) {
  const c = fs.readFileSync(path.join(ROOT, "node_modules/@arcevo/facet-components/dist/index.d.ts"), "utf8");
  fcExports = parseDtsExports(c);
  fcSource = "dts-parse";
}
console.log(`facet-components: ${fcExports ? fcExports.size : "null"} exports [${fcSource}]`);

// lucide-react: runtime require (ground truth for both base + *Icon names)
const lrExports = requireExportNames("lucide-react");
console.log(`lucide-react: ${lrExports.size} exports`);

// facet-auth/sdk/store/layout: runtime require, with d.ts fallback
const otherPkgs = [
  { pkg: "@arcevo/facet-auth", dir: "node_modules/@arcevo/facet-auth/dist/index.d.ts" },
  { pkg: "@arcevo/facet-store", dir: "node_modules/@arcevo/facet-store/dist/index.d.ts" },
  { pkg: "@arvevo/facet-layout", dir: "node_modules/@arvevo/facet-layout/dist/index.d.ts" },
];
otherPkgs[2].pkg = "@arcevo/facet-layout";
otherPkgs[2].dir = "node_modules/@arvevo/facet-layout/dist/index.d.ts";
otherPkgs[2].dir = "node_modules/@arcevo/facet-layout/dist/index.d.ts".replace("@arvevo","@arcevo");
const pkgExports = { "@arcevo/facet-components": fcExports, "lucide-react": lrExports };
for (const { pkg, dir } of otherPkgs) {
  let n = requireExportNames(pkg);
  let src = "runtime";
  if (!n) {
    try { const c = fs.readFileSync(path.join(ROOT, dir), "utf8"); n = parseDtsExports(c); src = "dts"; } catch (e) { n = null; src = "none"; }
  }
  pkgExports[pkg] = n;
  console.log(`${pkg}: ${n ? n.size : "null"} exports [${src}]`);
}

// ---- 2. Walk src/, extract ALL imports (multi-line aware) ----
function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if ([".ts", ".tsx", ".css"].includes(path.extname(e.name))) out.push(full);
  }
  return out;
}

// multi-line import regex over whole content
const IMPORT_RE = /import\s+(?:type\s*)?\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']/g;
const SIDEEFFECT_RE = /import\s*["']([^"']+)["']/g;

function extractNames(braceContent) {
  const names = [];
  for (const raw of braceContent.split(",")) {
    let t = raw.trim().replace(/^type\s+/, "").trim();
    if (!t) continue;
    const asMatch = t.match(/^(.+?)\s+as\s+(.+)$/);
    names.push(asMatch ? asMatch[2].trim() : t.replace(/\s.*/, "").trim());
  }
  return names;
}

const mismatches = [];
const validFacet = [];
const cssImports = [];

for (const full of walk(path.join(ROOT, "src"))) {
  const rel = path.relative(ROOT, full).replace(/\\/g, "/");
  const c = fs.readFileSync(full, "utf8");

  // side-effect CSS imports
  let m;
  const cssRe = /@import\s+["']([^"']+)["']/g;
  while ((m = cssRe.exec(c)) !== null) cssImports.push({ file: rel, spec: m[1] });

  // named imports
  let m2;
  const re = new RegExp(IMPORT_RE.source, "g");
  while ((m2 = re.exec(c)) !== null) {
    const names = extractNames(m2[1]);
    const spec = m2[2];
    if (!spec.startsWith("@")) continue;
    for (const n of names) {
      const pkgMatch = spec.match(/^(@arcevo\/[a-z-]+)(\/.*)?$/);
      if (pkgMatch) {
        const pkg = pkgMatch[1];
        const set = pkgExports[pkg];
        if (!set || !set.has(n)) {
          mismatches.push({ file: rel, pkg, name: n, spec });
        } else {
          validFacet.push({ file: rel, pkg, name: n });
        }
      }
    }
  }
}

console.log("\n=== ALL MISMATCHES (imported name NOT a real export) ===");
const byPkg = {};
for (const mm of mismatches) (byPkg[mm.pkg] ||= []).push(mm);
for (const pkg of Object.keys(byPkg).sort()) {
  console.log(`\n--- from ${pkg} ---`);
  const byFile = {};
  for (const mm of byPkg[pkg]) (byFile[mm.file] ||= []).push(mm.name);
  for (const f of Object.keys(byFile).sort()) {
    console.log(`  ${f}: ${byFile[f].join(", ")}`);
    // suggestions
    for (const n of byFile[f]) {
      let sug = "";
      if (lrExports && lrExports.has(n)) sug = " -> lucide-react (or @arcevo/facet-components/icons)";
      else if (pkg === "@arcevo/facet-components" && n === "Command" ) sug = " -> cmdk (namespace API)";
      else if (pkg === "@arcevo/facet-components" && n === "cn") sug=" -> @arvevo/facet-components (re-export)";
      // generic suggestions
      const alts = { clsx:"clsx", ClassValue:"clsx", twMerge:"tailwind-merge", cva:"class-variance-authority", VariantProps:"class-variance-authority", CommandPrimitive:"cmdk", OTPInput:"input-otp (rename: OTPInput->InputOTP from facet OR use input-otp)", OTPInputContext:"input-otp", Sonner:"sonner (Toaster)", ToasterProps:"sonner", toast:"sonner", toggleVariants:"<local @/components/ui/toggle> or facet" };
      if (alts[n] && !sug) sug = " -> " + alts[n];
      if (sug) console.log(`      (${n})${sug}`);
    }
  }
}

console.log("\n=== CSS @import lines (facet-tokens subpaths) ===");
for (const {file, spec} of cssImports) if (spec.includes("facet")) console.log("  " + file + " -> " + spec);

console.log("\n=== SUMMARY ===");
console.log("mismatches: " + mismatches.length);
console.log("valid facet imports: " + validFacet.length);
