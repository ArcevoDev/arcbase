// Definitively check which icon names @arcevo/facet-components main entry exports.
// Compare base lucide names vs *Icon suffixed names, for both the icon-registry
// imports and the ui/* imports.
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

const idx = fs.readFileSync(path.join(ROOT, "node_modules/@arcevo/facet-components/dist/index.d.ts"), "utf8");
const re = /export\s*\{([^}]*)\}/g;
let s = ""; let x;
while ((x = re.exec(idx)) !== null) s += x[1] + ",";

// Extract exported names (handle "type X", "X as Y", trailing commas)
const names = new Set();
for (const tok of s.split(",")) {
  let t = tok.trim();
  if (!t) continue;
  t = t.replace(/^type\s+/, "");
  const a = t.match(/^(.+?)\s+as\s+(.+)$/);
  if (a) names.add(a[2].trim());
  else {
    // could be "name" or "name," — take first word
    const w = t.replace(/[:,].*$/, "").trim();
    if (w) names.add(w);
  }
}

// Base names used by icon-registry.ts
const baseNames = ["Menu","X","ArrowRight","ArrowLeft","ChevronDown","ChevronUp","ChevronRight","ChevronLeft","MoreVertical","MoreHorizontal","Search","Filter","Settings","User","LogOut","Bell","Heart","MessageCircle","Share2","Bookmark","Flag","Trash2","Edit","Copy","Download","Upload","Eye","EyeOff","Lock","Unlock","Check","Plus","Minus","Loader","AlertCircle","CheckCircle2","XCircle","FileText","BookOpen","Lightbulb","Zap","Network","History","BarChart3","TrendingUp","Activity","Calendar","Clock","MapPin","Link","Github","Twitter","Mail","Shield","Home","Folder","FolderOpen","Archive","Image","Video","Music","File","Code","AlertTriangle","Info","HelpCircle","Users","Send"];

// *Icon names used by ui/* files
const iconNames = ["ChevronDownIcon","ChevronUpIcon","ChevronRightIcon","ChevronLeftIcon","MoreHorizontalIcon","MinusIcon","PanelLeftIcon","SearchIcon","CheckIcon","CircleCheckIcon","InfoIcon","TriangleAlertIcon","OctagonXIcon","Loader2Icon"];

console.log("=== Base lucide names (used by icon-registry.ts) — facet main export? ===");
const baseMissing = [];
for (const n of baseNames) if (!names.has(n)) baseMissing.push(n);
console.log("total:", baseNames.length, "| in facet:", baseNames.length - baseMissing.length, "| MISSING:", baseMissing.join(", "));

console.log("\n=== *Icon names (used by ui/*) — facet main export? ===");
const iconMissing = [];
for (const n of iconNames) if (!names.has(n)) iconMissing.push(n);
console.log("total:", iconNames.length, "| in facet:", iconNames.length - iconMissing.length, "| MISSING:", iconMissing.join(", "));

console.log("\n=== Sample base names — are these the facet-branded Icon variants? ===");
for (const n of ["Github","GithubIcon","Twitter","TwitterIcon","X","XIcon","Mail","LogOut","Loader"]) {
  console.log(`  ${n}: facet=${names.has(n)}`);
}

// Check that lucide-react (the real pkg) genuinely exports the *Icon names (the verified source for ui/*)
console.log("\n=== lucide-react exports *Icon names? (runtime require) ===");
try {
  const lr = require("lucide-react");
  for (const n of iconNames) console.log(`  ${n}: ${typeof lr[n] !== "undefined" ? "YES" : "NO"}`);
} catch (e) { console.log("  require lucide-react failed:", e.message); }
