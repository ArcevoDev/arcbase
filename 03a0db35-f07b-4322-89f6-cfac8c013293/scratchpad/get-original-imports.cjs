// Dump original (pre-facet-migration, from commit 611164a) import lines
// for every file whose imports were changed to @arcevo/facet-* .
const { execSync } = require("child_process");

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
  let content = "";
  try {
    content = execSync(`git show 611164a:${f}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
  } catch (e) {
    console.log(`=== ${f} === (NOT FOUND at 611164a)`);
    continue;
  }
  console.log(`=== ${f} ===`);
  const lines = content.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/import\b/.test(lines[i]) && /from\s*["']/.test(lines[i])) {
      console.log(`  ${i + 1}: ${lines[i].trim()}`);
    }
  }
}
