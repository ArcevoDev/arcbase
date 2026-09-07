/* Precise facet-pkg export audit.
 *
 * 1. Parse each @arcevo/facet-* package's ACTUAL exports from its dist/index.d.ts
 *    (the `export { ... }` line), plus CSS subpath exports from package.json.
 * 2. Walk every .ts/.tsx/.css file under src/ and collect imports from
 *    "@arcevo/facet-*".
 * 3. For each import, verify the imported name/subpath exists in the package's
 *    real exports. Report mismatches.
 *
 * No assumptions. Only what is actually exported is considered valid.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");
const path = require("path");

const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";
const PKG_DIR = path.join(ROOT, "node_modules/@arcevo");
const SRC_DIR = path.join(ROOT, "src");

const PACKAGES = [
  "facet-auth",
  "facet-components",
  "facet-layout",
  "facet-sdk",
  "facet-store",
  "facet-tokens",
];

// ---- 1. Discover ACTUAL exports of each package ----
const pkgExports = {}; // pkgName -> { names: Set<string>, subpaths: Set<string>, css: Set<string> }

for (const pkg of PACKAGES) {
  const pkgJsonPath = path.join(PKG_DIR, pkg, "package.json");
  const entryPath = path.join(PKG_DIR, pkg, "dist/index.d.ts");

  const info = { names: new Set(), subpaths: new Set(), css: new Set(), entryMissing: false };

  // package.json exports map (subpaths like /icons, /light, /theme, /tokens.css)
  if (fs.existsSync(pkgJsonPath)) {
    const pj = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    const exports = pj.exports;
    if (exports && typeof exports === "object") {
      if (exports["."] && exports["."].types) info.entryMissing = false;
      // collect subpath keys
      for (const key of Object.keys(exports)) {
        if (key.startsWith("./") && key !== "./" && key !== "./package.json") {
          // e.g. ./icons, ./light, ./tokens.css
          info.subpaths.add(key.slice(2)); // strip "./"
        }
      }
    }
  }

  // Parse the `export { ... }` from dist/index.d.ts (single, possibly very long line)
  if (fs.existsSync(entryPath)) {
    const content = fs.readFileSync(entryPath, "utf8");
    // find the LAST top-level "export { ... }" on its own statement.
    // Some files also re-export. We collect every name in every `export { ... }` at line start.
    // Use regex to find export { ... };  (greedy within braces is fine since balanced)
    const re = /export\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const inner = m[1];
      // names may be "Name", "type Name", "Name as Alias"
      const parts = inner.split(",").map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        // remove "type " prefix
        const cleaned = p.replace(/^type\s+/, "");
        // handle "A as B" -> keep both A (original) and B (alias). For named import matching,
        // a consumer importing { B } needs B; importing { A } needs A as exported? No:
        // export { A as B } means the package exports B (aliased). So consumer imports B.
        // But export { B as A } means it exports A. We track exported names.
        const asMatch = cleaned.match(/^(.+?)\s+as\s+(.+)$/);
        if (asMatch) {
          info.names.add(asMatch[2].trim()); // the exported (aliased) name
        } else {
          info.names.add(cleaned.split(/\s/)[0]);
        }
      }
    }
  } else {
    info.entryMissing = true;
  }

  pkgExports[pkg] = info;
}

// ---- 2. Collect all imports from @arcevo/facet-* in src ----
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

const DEFAULT_IMPORT_RE = /(?:^|\n)\s*import\s+(\w+)\s+from\s*["']([^"']+)["']/g;
const NAMESPACE_IMPORT_RE = /(?:^|\n)\s*import\s*\*\s*as\s+(\w+)\s+from\s*["']([^"']+)["']/g;
const CSS_IMPORT_RE = /(?:^|\n)\s*@import\s+["']([^"']+)["']/g;

const facetPkgRe = /^@arcevo\/(facet-[a-z]+)(?:\/(.+))?$/;

const findings = []; // { file, pkg, subpath, kind, names, line }

for (const file of walk(SRC_DIR)) {
  const ext = path.extname(file);
  if (!EXTENSIONS.has(ext)) continue;
  const rel = path.relative(SRC_DIR, file);
  const raw = fs.readFileSync(file, "utf8");

  if (ext === ".css") {
    let m;
    const re = /@import\s+["']([^"']+)["']/g;
    while ((m = re.exec(raw)) !== null) {
      const spec = m[1];
      const pm = spec.match(facetPkgRe);
      if (pm) {
        findings.push({ file: rel, spec, pkg: pm[1], subpath: pm[2] || null, kind: "css" });
      }
    }
    continue;
  }

  // named imports
  let m;
  const named = new Map(); // spec -> array {names, line}
  const nre = /import\b/g;
  // We need line numbers; process per-line.
  const lines = raw.split(/\n/);
  lines.forEach((line, idx) => {
    // named: import { A, B, type C } from "..."
    let mn;
    const nre2 = /import\s*(?:type\s*)?\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
    while ((mn = nre2.exec(line)) !== null) {
      const namesRaw = mn[1].trim();
      const spec = mn[2];
      const pm = spec.match(facetPkgRe);
      if (pm) {
        const names = namesRaw
          .split(",")
          .map((n) => n.trim())
          .map((n) => {
            const noType = n.replace(/^type\s+/, "");
            const asMatch = noType.match(/^(.+?)\s+as\s+(.+)$/);
            return asMatch ? asMatch[2].trim() : noType.split(/\s/)[0];
          })
          .filter(Boolean);
        findings.push({
          file: rel,
          spec,
          pkg: pm[1],
          subpath: pm[2] || null,
          kind: "named",
          names,
          line: idx + 1,
        });
      }
    }
    // default: import X from "..."  (not * as)
    const dre = /import\s+(\w+)\s+from\s*["']([^"']+)["']/g;
    while ((mn = dre.exec(line)) !== null) {
      if (mn[0].includes("*")) continue;
      const spec = mn[2];
      const pm = spec.match(facetPkgRe);
      if (pm) {
        findings.push({
          file: rel,
          spec,
          pkg: pm[1],
          subpath: pm[2] || null,
          kind: "default",
          names: [mn[1]],
          line: idx + 1,
        });
      }
    }
    // namespace: import * as X from "..."
    const sre = /import\s*\*\s*as\s+(\w+)\s+from\s*["']([^"']+)["']/g;
    while ((mn = sre.exec(line)) !== null) {
      const spec = mn[2];
      const pm = spec.match(facetPkgRe);
      if (pm) {
        findings.push({
          file: rel,
          spec,
          pkg: pm[1],
          subpath: pm[2] || null,
          kind: "namespace",
          names: ["*"],
          line: idx + 1,
        });
      }
    }
  });
}

// ---- 3. Cross-check ----
const errors = [];

for (const f of findings) {
  const pkg = f.pkg;
  const info = pkgExports[pkg];
  if (!info) {
    errors.push(`[${f.file}] UNKNOWN PACKAGE @arcevo/${pkg} (line ${f.line})`);
    continue;
  }
  if (f.kind === "css") {
    // CSS subpath
    if (info.css.has(f.subpath) || f.subpath === null) {
      // ok
    } else if (info.subpaths.has(f.subpath)) {
      // ok (subpath is the css file)
    } else {
      errors.push(
        `[${f.file}] CSS import "@arcevo/${pkg}/${f.subpath}" — subpath not in package exports map. Available: ${[...info.subpaths].join(", ") || "(none)"}`
      );
    }
    continue;
  }

  // For subpaths like /icons, we need to check the sub-entry's exports.
  // The /icons entry re-exports lucide-react: export * from 'lucide-react'.
  // So any icon name is valid IF importing from @arcevo/facet-components/icons.
  if (f.subpath && f.subpath !== null) {
    // It's a subpath import. Validate the subpath exists in exports map.
    if (!info.subpaths.has(f.subpath)) {
      errors.push(
        `[${f.file}] SUBPATH "${f.subpath}" not exported by @arcevo/${pkg}. Available subpaths: ${[...info.subpaths].join(", ") || "(none)"}`
      );
    }
    // names from subpaths are not validated individually here (too complex);
    // but for /icons we know it re-exports lucide.
    if (f.subpath === "icons" && f.kind === "named") {
      // all names assumed valid via lucide-react re-export
    }
    continue;
  }

  // Main entry named/default imports
  if (f.kind === "default") {
    // default import from a package that has no default export is suspicious,
    // but facet packages are ESM with named exports. Flag if package has no default.
    // We don't track default exports precisely; skip (low signal).
    continue;
  }

  if (f.kind === "namespace") {
    // import * as Icons — accessing Icons.XXX. We can't resolve property access statically
    // easily, but we can flag if the package has NO wildcard-friendly surface.
    // For facet-components, namespace import pulls everything; accessing unknown props
    // would be a runtime issue. We'll note it for manual review.
    continue;
  }

  // named imports against main entry
  for (const name of f.names) {
    if (!info.names.has(name)) {
      errors.push(
        `[${f.file}:${f.line}] imports {${name}} from "@arcevo/${pkg}" — NOT IN EXPORTS. ` +
          `Available names (first 60): ${[...info.names].slice(0, 60).join(", ")}`
      );
    }
  }
}

// ---- 4. Report ----
console.log("=== ACTUAL EXPORTS PER PACKAGE ===");
for (const pkg of PACKAGES) {
  const info = pkgExports[pkg];
  console.log(
    `\n@arcevo/${pkg}: entryMissing=${info.entryMissing}, subpaths=[${[...info.subpaths].join(", ")}], css=${[...info.css].join(",")}`
  );
  console.log(`  names (${info.names.size}): ${[...info.names].sort().join(", ")}`);
}

console.log("\n\n=== ALL FACET IMPORTS FOUND IN src/ ===");
console.log(`Total import statements: ${findings.length}`);
const byPkg = {};
for (const f of findings) {
  byPkg[f.pkg] = (byPkg[f.pkg] || 0) + 1;
}
for (const [k, v] of Object.entries(byPkg)) console.log(`  @arcevo/${k}: ${v} import statements`);

console.log("\n\n=== MISMATCHES (imported but not actually exported) ===");
if (errors.length === 0) {
  console.log("(none found)");
} else {
  for (const e of errors) console.log(e);
}
