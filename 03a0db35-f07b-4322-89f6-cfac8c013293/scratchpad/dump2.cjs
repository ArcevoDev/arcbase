const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";
const files = [
  "src/components/ui/button.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/toggle.tsx",
  "src/components/ui/toggle-group.tsx",
  "src/components/ui/alert.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/accordion.tsx",
  "src/components/ui/breadcrumb.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/ui/context-menu.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/menubar.tsx",
  "src/components/ui/navigation-menu.tsx",
  "src/components/ui/select.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
];
let out = "";
for (const f of files) {
  const full = path.join(ROOT, f);
  out += "\n\n########## " + f + " ##########\n";
  try { out += fs.readFileSync(full, "utf8"); } catch (e) { out += "[READ ERROR: " + e.message + "]"; }
}
fs.writeFileSync(path.join(ROOT, "03a0db35-f07b-4322-89f6-cfac8c013293/scratchpad/dump2.txt"), out);
console.log("written dump2.txt (" + out.length + " chars)");
