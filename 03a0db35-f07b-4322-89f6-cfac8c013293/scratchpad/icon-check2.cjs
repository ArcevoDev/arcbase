// Fast check: only read the 3 root .d.ts files of lucide-react + facet icons.d.ts.
// Check which icon names each exports. Then print ORIGINAL(611164a) vs CURRENT imports.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";
function runGit(args) {
  try { return execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8" }).trim(); }
  catch (e) { return null; }
}
const names = ["CheckIcon", "ChevronDownIcon", "ChevronUpIcon", "ChevronRightIcon", "ChevronLeftIcon",
  "MoreHorizontalIcon", "MinusIcon", "PanelLeftIcon", "SearchIcon", "CircleCheckIcon",
  "InfoIcon", "TriangleAlertIcon", "OctagonXIcon", "Loader2Icon", "Check", "ChevronDown"];

function readSafe(p) {
  try { return fs.existsSync(p) ? fs.readFileSync(p, "utf8").slice(0, 200000) : "<missing>"; }
  catch (e) { return "<err>"; }
}

const files = {
  "lucide-react (root .d.ts)": "node_modules/lucide-react/lucide-react.d.ts",
  "lucide-react (dist/lucide-react.d.ts)": "node_modules/lucide-react/dist/lucide-react.d.ts",
  "lucide-react (dist/lucide-react.suffixed.d.ts)": "node_modules/lucide-react/dist/lucide-react.suffixed.d.ts",
  "@arcevo/facet-components/icons.d.ts": "node_modules/@arcevo/facet-components/dist/icons.d.ts",
};
for (const [label, rel] of Object.entries(files)) {
  const c = readSafe(path.join(ROOT, rel));
  const found = names.filter(n => c.includes(n));
  console.log(`=== ${label} === (${c === "<missing>" || c === "<err>" ? "UNREADABLE" : "ok, " + c.length + " chars"})`);
  if (c === "<missing>" || c === "<err>") continue;
  console.log("  found " + found.length + ": " + found.join(","));
}

console.log("\n=== ORIGINAL(611164a) vs CURRENT imports ===");
const rels = [
  "src/components/ui/button.tsx", "src/components/ui/badge.tsx", "src/components/ui/toggle.tsx",
  "src/components/ui/toggle-group.tsx", "src/components/ui/alert.tsx", "src/components/ui/input-group.tsx",
  "src/components/ui/sidebar.tsx", "src/components/ui/tabs.tsx", "src/components/ui/accordion.tsx",
  "src/components/ui/breadcrumb.tsx", "src/components/ui/carousel.tsx", "src/components/ui/checkbox.tsx",
  "src/components/ui/command.tsx", "src/components/ui/context-menu.tsx", "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/input-otp.tsx", "src/components/ui/menubar.tsx", "src/components/ui/navigation-menu.tsx",
  "src/components/ui/select.tsx", "src/components/ui/sonner.tsx", "src/lib/utils.ts",
];
const importRE = /import\s*(?:type\s*)?\s*(?:\[[^\]]*\]|\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*from\s*["']([^"']+)["']/g;
function extractImportLines(text) {
  const out = []; let m; const re = new RegExp(importRE.source, "g");
  while ((m = re.exec(text)) !== null) out.push((m[0].replace(/\s+/g, " ").trim()) + "  <<from " + m[1]);
  return out;
}
for (const rel of rels) {
  console.log("\n--- " + rel + " ---");
  const orig = runGit(`show 611164a:${rel}`);
  if (orig === null) console.log("  [NOT IN 611164a]");
  else {
    const lines = extractImportLines(orig);
    if (!lines.length) console.log("  [no import lines in original]");
    else lines.forEach(l => console.log("  ORIG: " + l));
  }
  const cur = fs.readFileSync(path.join(ROOT, rel), "utf8");
  extractImportLines(cur).forEach(l => console.log("  CURR: " + l));
}
