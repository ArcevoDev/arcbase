// 1) Inspect lucide-react package.json (version, exports, types).
// 2) Search ALL .d.ts files in lucide-react for CheckIcon / ChevronDownIcon.
// 3) Print ORIGINAL(611164a) vs CURRENT working-tree import lines for every ui file + login/register.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

function runGit(args) {
  try { return execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8" }).trim(); }
  catch (e) { return "<git-error>"; }
}

console.log("=== lucide-react package.json (version/exports/types) ===");
const lrPkgPath = path.join(ROOT, "node_modules/lucide-react/package.json");
if (fs.existsSync(lrPkgPath)) {
  const pj = JSON.parse(fs.readFileSync(lrPkgPath, "utf8"));
  console.log("version:", pj.version);
  console.log("main:", pj.main, "| module:", pj.module, "| types:", pj.types, "| type:", pj.type);
  console.log("exports keys:", Object.keys(pj.exports || {}));
  // list dist files
  const dist = path.join(ROOT, "node_modules/lucide-react/dist");
  if (fs.existsSync(dist)) console.log("dist entries:", fs.readdirSync(dist).slice(0, 40).join(", "));
} else { console.log("lucide-react NOT INSTALLED at root node_modules"); }

// Search all .d.ts under lucide-react for the icon names
const names = ["CheckIcon", "ChevronDownIcon", "ChevronUpIcon", "ChevronRightIcon", "ChevronLeftIcon",
  "MoreHorizontalIcon", "MinusIcon", "PanelLeftIcon", "SearchIcon", "CircleCheckIcon",
  "InfoIcon", "TriangleAlertIcon", "OctagonXIcon", "Loader2Icon", "Check", "ChevronDown"];
let blob = "";
const lrRoot = path.join(ROOT, "node_modules/lucide-react");
function walkCollect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkCollect(full);
    else if (e.name.endsWith(".d.ts")) blob += fs.readFileSync(full, "utf8") + "\n";
  }
}
if (fs.existsSync(lrRoot)) walkCollect(lrRoot);
console.log("\n=== lucide-react .d.ts icon name presence ===");
for (const n of names) console.log(`  ${n}: ${blob.includes(n) ? "FOUND" : "missing"}`);
// show a snippet around "CheckIcon" if present
const idx = blob.indexOf("CheckIcon");
if (idx >= 0) console.log("\ncontext around CheckIcon:\n  " + blob.slice(Math.max(0, idx - 60), idx + 80).replace(/\n/g, " "));

console.log("\n=== ORIGINAL(611164a) vs CURRENT imports: ui + auth pages ===");
const files = [
  "src/components/ui/button.tsx", "src/components/ui/badge.tsx", "src/components/ui/toggle.tsx",
  "src/components/ui/toggle-group.tsx", "src/components/ui/alert.tsx", "src/components/ui/input-group.tsx",
  "src/components/ui/sidebar.tsx", "src/components/ui/tabs.tsx", "src/components/ui/accordion.tsx",
  "src/components/ui/breadcrumb.tsx", "src/components/ui/carousel.tsx", "src/components/ui/checkbox.tsx",
  "src/components/ui/command.tsx", "src/components/ui/context-menu.tsx", "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/input-otp.tsx", "src/components/ui/menubar.tsx", "src/components/ui/navigation-menu.tsx",
  "src/components/ui/select.tsx", "src/components/ui/sonner.tsx", "src/lib/utils.ts",
  "src/app/(auth)/login/page.tsx", "src/app/(auth)/register/page.tsx",
];
const importLine = /import\s*(?:type\s*)?\s*(?:\[[^\]]*\]|\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*from\s*["']([^"']+)["']/g;
for (const rel of files) {
  console.log("\n--- " + rel + " ---");
  const orig = runGit(`show 611164a:${rel}`);
  console.log(orig === "<git-error>" ? "  [NOT IN 611164a]" : (orig === "" ? "  [empty]" : (() => {
    const out = [];
    let m; const re = new RegExp(importLine.source, "g");
    while ((m = re.exec(orig)) !== null) out.push("  ORIG: " + m[0].replace(/\s+/g, " ").trim() + "  <-- from " + m[1]);
    return out.join("\n");
  })()));
  const cur = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const cout = []; let m2; const rec2 = new RegExp(importLine.source, "g");
  while ((m2 = rec2.exec(cur)) !== null) cout.push("  CURR: " + m2[0].replace(/\s+/g, " ").trim() + "  <-- from " + m2[1]);
  console.log(cout.join("\n"));
}
