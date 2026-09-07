// Definitively classify each icon name imported by icon-registry.ts:
//   - present in lucide-react?  -> true lucide icon -> source "lucide-react"
//   - absent from lucide-react but present in facet? -> facet branded icon -> source "@arcevo/facet-components"
//   - absent from both -> PROBLEM (unresolvable)
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";

const lr = require("lucide-react");

const idx = fs.readFileSync(path.join(ROOT, "node_modules/@arcevo/facet-components/dist/index.d.ts"), "utf8");
const re = /export\s*\{([^}]*)\}/g;
let s = ""; let x;
while ((x = re.exec(idx)) !== null) s += x[1] + ",";
const facetNames = new Set();
for (const tok of s.split(",")) {
  let t = tok.trim();
  if (!t) continue;
  t = t.replace(/^type\s+/, "");
  const a = t.match(/^(.+?)\s+as\s+(.+)$/);
  if (a) facetNames.add(a[2].trim());
  else { const w = t.replace(/[:,].*$/, "").trim(); if (w) facetNames.add(w); }
}

// The exact names the icon-registry imports (in source order)
const names = ["Menu","X","ArrowRight","ArrowLeft","ChevronDown","ChevronUp","ChevronRight","ChevronLeft",
  "MoreVertical","MoreHorizontal","Search","Filter","Settings","User","LogOut","Bell","Heart","MessageCircle",
  "Share2","Bookmark","Flag","Trash2","Edit","Copy","Download","Upload","Eye","EyeOff","Lock","Unlock","Check",
  "Plus","Minus","Loader","AlertCircle","CheckCircle2","XCircle","FileText","BookOpen","Lightbulb","Zap",
  "Network","History","BarChart3","TrendingUp","Activity","Calendar","Clock","MapPin","Link","Github",
  "Twitter","Mail","Shield","Home","Folder","FolderOpen","Archive","Image","Video","Music","File","Code",
  "AlertTriangle","Info","HelpCircle","Users","Send"];

const lucide = [], facet = [], both = [], neither = [];
for (const n of names) {
  const inLr = typeof lr[n] !== "undefined";
  const inFacet = facetNames.has(n);
  if (inLr && inFacet) both.push(n);
  else if (inLr) lucide.push(n);
  else if (inFacet) facet.push(n);
  else neither.push(n);
}
console.log("lucide-react only:", lucide.join(", "));
console.log("facet only:", facet.join(", "));
console.log("both:", both.join(", "));
console.log("NEITHER (PROBLEM):", neither.join(", "));
