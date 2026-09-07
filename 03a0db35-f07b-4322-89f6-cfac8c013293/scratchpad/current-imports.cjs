// Dump CURRENT (working-tree) import lines for all affected files,
// and list every facet import that is NOT a mismatch (facet-auth/sdk/tokens/etc.)
const fs = require("fs");
const path = require("path");

const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";
const files = [
  "src/components/ui/button.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/toggle.tsx",
  "src/components/ui/toggle-group.tsx",
  "src/components/ui/alert.tsx",
  "src/components/ui/input-group.tsx",
  "src/components/ui/sidebar.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/accordion.tsx",
  "src/components/ui/breadcrumb.tsx",
  "src/components/ui/carousel.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/context-menu.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/input-otp.tsx",
  "src/components/ui/menubar.tsx",
  "src/components/ui/navigation-menu.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/sonner.tsx",
  "src/lib/utils.ts",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
];

for (const f of files) {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) { console.log(`=== ${f} === (MISSING)`); continue; }
  console.log(`=== ${f} ===`);
  const lines = fs.readFileSync(full, "utf8").split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/import\b/.test(lines[i]) && /from\s*["']/.test(lines[i])) {
      console.log(`  ${i + 1}: ${lines[i].trim()}`);
    }
  }
}
