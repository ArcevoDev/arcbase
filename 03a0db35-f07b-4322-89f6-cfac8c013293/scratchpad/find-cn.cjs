// Find the `cn` declaration/definition across all facet .d.ts files.
const fs = require("fs");
const path = require("path");
const dir = "C:/Users/HP/Desktop/ArcevoDev/arcbase/node_modules/@arcevo/facet-components/dist";
for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".d.ts"))) {
  const p = path.join(dir, f);
  const c = fs.readFileSync(p, "utf8");
  const lines = c.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/cn/.test(l) && /declare/.test(l) && l.length < 400) {
      // print lines mentioning cn with declare, plus a few context lines
      console.log(`${f}:${i + 1}: ${l.trim()}`);
    }
  }
}
// Also: find the export alias for cn (e.g. "m as cn" or "cn as ...")
console.log("\n=== cn export aliases ===");
const idx = fs.readFileSync(path.join(dir, "index.d.ts"), "utf8");
for (const l of idx.split("\n")) {
  if (/cn/.test(l) && /as/.test(l) && l.length < 300 && /import/.test(l)) {
    console.log("  " + l.trim());
  }
}
