const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = "C:/Users/HP/Desktop/ArcevoDev/arcbase";
const origRef = "611164a"; // initial setup commit (pre-migration baseline)

const files = [
  "src/lib/utils.ts",
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
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
];

function gitShow(rev, file) {
  try {
    return execSync(`git -C "${ROOT}" show ${rev}:${file}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    return null; // file didn't exist at that ref
  }
}

function extractImports(content) {
  if (!content) return [];
  const out = [];
  const lines = content.split("\n");
  // handle single-line imports
  const single = /import\s+(?:type\s*)?(?:\[[^\]]*\]|\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*from\s*["']([^"']+)["']/;
  for (const line of lines) {
    if (single.test(line)) {
      out.push(line.trim());
    }
  }
  return out;
}

const report = [];
for (const f of files) {
  report.push("");
  report.push("==== " + f + " ====");
  const cur = (() => { try { return fs.readFileSync(path.join(ROOT, f), "utf8"); } catch (e) { return null; } })();
  const orig = gitShow(origRef, f);
  report.push("--- CURRENT (HEAD/working) import lines ---");
  (extractImports(cur) || []).forEach((l) => report.push(l));
  report.push("--- ORIGINAL (611164a) import lines ---");
  (extractImports(orig) || []).forEach((l) => report.push(l));
}

fs.writeFileSync(
  path.join(ROOT, "03a0db35-f07b-4322-89f6-cfac8c013293/scratchpad/orig-imports.txt"),
  report.join("\n"),
);
console.log("written. lines=" + report.length);
