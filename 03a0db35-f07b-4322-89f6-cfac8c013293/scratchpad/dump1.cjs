const fs = require("fs");
const path = require("path");
const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";
const files = [
  "src/lib/utils.ts",
  "src/components/ui/sidebar.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/input-otp.tsx",
  "src/components/ui/sonner.tsx",
  "src/components/ui/calendar.tsx",
  "src/components/ui/pagination.tsx",
  "src/components/ui/input-group.tsx",
  "src/components/ui/carousel.tsx",
  "src/lib/useful/utils/icon-registry.ts",
];
let out = "";
for (const f of files) {
  const full = path.join(ROOT, f);
  out += "\n\n########## " + f + " ##########\n";
  try { out += fs.readFileSync(full, "utf8"); } catch (e) { out += "[READ ERROR: " + e.message + "]"; }
}
fs.writeFileSync(path.join(ROOT, "03a0db35-f07b-4322-89f6-cfac8c013293/scratchpad/dump1.txt"), out);
console.log("written dump1.txt (" + out.length + " chars)");
