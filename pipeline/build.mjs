// Step 4: verify every edition, then publish editions.json and embed it in the app.
// usage: node build.mjs [--keep 14] [--no-embed]
// Exits non-zero (and writes nothing) if any edition has an error. Warnings print but don't block.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const keep = Number(process.argv[process.argv.indexOf("--keep") + 1]) || 14;
const CATS = ["Politics", "Conflict", "War", "Security", "Disaster", "Migration", "Economy", "Society", "Rights", "Science", "Climate", "Health", "Tech", "Lighter"];

// land mask: 360x180 one-degree bitmap, same data the app's globe uses
const LAND = Buffer.from((await fs.readFile(path.join(here, "data/land.b64"), "utf8")).trim(), "base64");
const isLand = (lat, lon) => { const y = Math.min(179, Math.max(0, Math.floor(90 - lat))), x = ((Math.floor(lon + 180) % 360) + 360) % 360, i = y * 360 + x; return (LAND[i >> 3] >> (i & 7)) & 1; };
const nearLand = (lat, lon, r = 2) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (isLand(lat + dy, lon + dx)) return true; return false; };

const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
const norm = s => s.toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|twenty|thirty|forty|fifty|hundred)\b/g, w => NUMW[w]).replace(/(\d),(\d{3})/g, "$1$2");
const numbersIn = s => (norm(s.replace(/\{([^}|]+)(\|[^}]+)?\}/g, "$1")).match(/\d+(?:\.\d+)?/g) || []).filter(n => !/^(19|20)\d\d$/.test(n)); // years are background, checked by hand

const files = (await fs.readdir(path.join(here, "editions"))).filter(f => /^\d{4}-\d\d-\d\d\.mjs$/.test(f)).sort().reverse().slice(0, keep);
const glossary = JSON.parse(await fs.readFile(path.join(here, "glossary.json"), "utf8"));
const editions = []; let errors = 0, warnings = 0;
const err = (ed, m) => { errors++; console.log(`  ✗ ${ed}: ${m}`); };
const warn = (ed, m) => { warnings++; console.log(`  ! ${ed}: ${m}`); };

for (const f of files) {
  const ed = (await import(pathToFileURL(path.join(here, "editions", f)).href + `?t=${Date.now()}`)).default;
  const tag = `No.${ed.no} ${ed.date}`; console.log(`• ${tag}`);
  Object.assign(glossary, ed.glossary || {});
  let corpus = null;
  try { const src = JSON.parse(await fs.readFile(path.join(here, "editions", f.replace(".mjs", ".sources.json")), "utf8")); corpus = norm(src.clusters.flatMap(c => c.items.map(i => i.title + " " + i.summary)).join(" \n ")); }
  catch { warn(tag, "no .sources.json snapshot, skipping number fact-check"); }

  if (!ed.no || !/^\d{4}-\d\d-\d\d$/.test(ed.date)) err(tag, "missing no/date");
  if (!ed.stories?.length || ed.stories.length < 4) err(tag, "needs at least 4 stories");
  if (!ed.stories.some(s => s.lite)) warn(tag, "no lighter story");
  const ids = new Set();
  for (const s of ed.stories) {
    const st = `${tag} ${s.id}`;
    for (const k of ["id", "place", "city", "cat", "short", "hed", "body", "why", "ctx"]) if (!s[k]) err(st, `missing ${k}`);
    if (ids.has(s.id)) err(st, "duplicate id"); ids.add(s.id);
    if (!CATS.includes(s.cat)) err(st, `unknown category ${s.cat}`);
    if (!(Math.abs(s.lat) <= 90 && Math.abs(s.lon) <= 180)) err(st, "bad coordinates");
    else if (!nearLand(s.lat, s.lon)) err(st, `coordinates ${s.lat},${s.lon} are not near land; check geocoding`);
    if (s.short?.length > 48) warn(st, `short is ${s.short.length} chars (cover cards fit ~48)`);
    if (s.hed?.length > 80) warn(st, `hed is ${s.hed.length} chars`);
    const words = s.body?.split(/\s+/).length || 0; if (words > 85) warn(st, `body is ${words} words; keep it under ~80`);
    if (!s.sources?.length) err(st, "no sources");
    for (const [name, url] of s.sources || []) if (!/^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(url)) err(st, `bad source url for ${name}`);
    for (const m of (s.body + s.why + s.ctx).matchAll(/\{([^}|]+)(?:\|([^}]+))?\}/g)) { const key = m[2] || m[1]; if (!glossary[key]) err(st, `glossary term "${key}" has no definition`); }
    if (s.people) for (const p of s.people) if (!Array.isArray(p) || p.length !== 2) err(st, "people entries must be [name, role]");
    if (s.fig) { if (!s.fig.n || !s.fig.u) err(st, "fig needs n and u"); if (s.fig.type === "seats" && !(s.fig.mark <= s.fig.total)) err(st, "seats mark > total"); if (s.fig.type === "grid" && !(s.fig.pct >= 0 && s.fig.pct <= 100)) err(st, "grid pct out of range"); }
    // numbers stated as fact must appear somewhere in today's source snippets
    // s.verified lists background numbers an editor checked by hand (e.g. physics constants); everything else must be sourced
    if (corpus && !s.lite) for (const n of new Set([...numbersIn(s.hed), ...numbersIn(s.body), ...numbersIn(s.fig?.n || ""), ...numbersIn(s.fig?.u || "")]))
      if (!(s.verified || []).includes(n) && !new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}([^\\d]|$)`).test(corpus)) err(st, `number "${n}" isn't in any source snippet; verify or remove`);
  }
  if (ed.quiz?.length !== 3) err(tag, "quiz needs 3 questions");
  for (const q of ed.quiz || []) if (!(q.a?.length >= 2 && q.c >= 0 && q.c < q.a.length && q.x)) err(tag, `bad quiz item: ${q.q}`);
  editions.push(ed);
}

if (errors) { console.log(`\n${errors} error(s), ${warnings} warning(s). Nothing written.`); process.exit(1); }
const data = { generatedAt: new Date().toISOString(), glossary, editions };
await fs.writeFile(path.join(root, "editions.json"), JSON.stringify(data));
console.log(`\n✓ ${editions.length} editions, ${warnings} warning(s) → editions.json (${(JSON.stringify(data).length / 1024).toFixed(1)} KB)`);

if (!process.argv.includes("--no-embed")) {
  // embed as the app's offline fallback, between the DATA markers in index.html
  const p = path.join(root, "index.html"); const html = await fs.readFile(p, "utf8");
  const a = html.indexOf("/*DATA:START*/"), b = html.indexOf("/*DATA:END*/");
  if (a < 0 || b < 0) { console.log("! index.html has no DATA markers; not embedded"); process.exit(0); }
  await fs.writeFile(p, html.slice(0, a) + "/*DATA:START*/const EMBED = " + JSON.stringify(data) + ";" + html.slice(b));
  console.log("✓ embedded into index.html");
}
