// Step 4: verify every edition (lib/verify.mjs), then publish editions.json and embed it in the app.
// usage: node build.mjs [--keep 14] [--no-embed] [--verbose]
// Exits non-zero (and writes nothing) if any edition has an error. Warnings print but don't block.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verifyEdition } from "./lib/verify.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const keep = Number(process.argv[process.argv.indexOf("--keep") + 1]) || 14;
const verbose = process.argv.includes("--verbose");

// land mask: 360x180 one-degree bitmap, same data the app's globe uses
const LAND = Buffer.from((await fs.readFile(path.join(here, "data/land.b64"), "utf8")).trim(), "base64");
export const isLand = (lat, lon) => { const y = Math.min(179, Math.max(0, Math.floor(90 - lat))), x = ((Math.floor(lon + 180) % 360) + 360) % 360, i = y * 360 + x; return (LAND[i >> 3] >> (i & 7)) & 1; };

const files = (await fs.readdir(path.join(here, "editions"))).filter(f => /^\d{4}-\d\d-\d\d\.mjs$/.test(f)).sort().reverse().slice(0, keep);
const glossary = JSON.parse(await fs.readFile(path.join(here, "glossary.json"), "utf8"));
const editions = []; let errors = 0, warnings = 0;

for (const f of files) {
  const ed = (await import(pathToFileURL(path.join(here, "editions", f)).href + `?t=${Date.now()}`)).default;
  console.log(`• No.${ed.no} ${ed.date}`);
  Object.assign(glossary, ed.glossary || {});
  let snapshot = null;
  try { snapshot = JSON.parse(await fs.readFile(path.join(here, "editions", f.replace(".mjs", ".sources.json")), "utf8")); } catch {}
  const r = verifyEdition(ed, snapshot, glossary, { isLand });
  for (const m of r.errors) console.log(`  ✗ ${m}`);
  for (const m of r.warnings) console.log(`  ! ${m}`);
  if (verbose) console.log(`  stats ${JSON.stringify(r.stats)}`);
  errors += r.errors.length; warnings += r.warnings.length;
  editions.push(ed);
}

if (errors) { console.log(`\n${errors} error(s), ${warnings} warning(s). Nothing written.`); process.exit(1); }
const data = { generatedAt: new Date().toISOString(), glossary, editions };
await fs.writeFile(path.join(root, "editions.json"), JSON.stringify(data));
console.log(`\n✓ ${editions.length} editions, ${warnings} warning(s) → editions.json (${(JSON.stringify(data).length / 1024).toFixed(1)} KB)`);

if (!process.argv.includes("--no-embed")) {
  const app = path.join(root, "index.html");
  const html = await fs.readFile(app, "utf8");
  const start = html.indexOf("/*DATA:START*/"), end = html.indexOf("/*DATA:END*/");
  if (start < 0 || end < 0) { console.log("! index.html has no DATA markers; not embedding"); process.exit(0); }
  await fs.writeFile(app, html.slice(0, start) + `/*DATA:START*/const EMBED = ${JSON.stringify(data)};/*DATA:END*/` + html.slice(end + "/*DATA:END*/".length));
  console.log("✓ embedded into index.html");
}
