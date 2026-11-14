// Step 2½: fetch + cluster, snapshot the sources, and print the editor's brief.
// usage: node prepare.mjs [--date YYYY-MM-DD] [--hours 30] [--top 24] [--no-fetch]
// exit codes: 0 brief printed · 2 edition already exists · 3 no clusters (don't write)
// This is what a Claude Code editor session reads before writing editions/DATE.mjs by hand
// (see EDITOR.md). No API key is involved anywhere in this step.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const run = promisify(execFile);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const date = arg("--date", new Date().toISOString().slice(0, 10));
const hours = arg("--hours", "30"), top = Number(arg("--top", "24"));

const file = path.join(here, "editions", `${date}.mjs`);
try { await fs.access(file); console.log(`STOP: editions/${date}.mjs already exists. Nothing to do today.`); process.exit(2); } catch {}

// Clusters come from one of two places, whichever is fresher:
//  - a live fetch (works on a machine with open internet)
//  - pipeline/inbox/clusters.json, committed by the `fetch` GitHub Action, for environments whose
//    network policy blocks the news sites (the daily Claude Code routine runs in one of those).
const FRESH_H = 20;
const age = iso => (Date.now() - Date.parse(iso)) / 36e5;
let live = null, inbox = null;
if (!process.argv.includes("--no-fetch")) {
  try {
    const f = await run("node", [path.join(here, "fetch.mjs"), "--hours", hours], { cwd: here, maxBuffer: 1 << 26 });
    process.stderr.write(f.stdout.split("\n").slice(-2).join("\n") + "\n");
    const c = await run("node", [path.join(here, "cluster.mjs"), "--top", "40"], { cwd: here, maxBuffer: 1 << 26 });
    process.stderr.write(c.stdout.split("\n").slice(-2).join("\n") + "\n");
    live = JSON.parse(await fs.readFile(path.join(here, "out/clusters.json"), "utf8"));
    if (!live.clusters?.length) { process.stderr.write("live fetch returned no clusters (network blocked?)\n"); live = null; }
  } catch (e) { process.stderr.write(`live fetch failed: ${e.message.split("\n")[0]}\n`); }
}
try { inbox = JSON.parse(await fs.readFile(path.join(here, "inbox/clusters.json"), "utf8")); if (!inbox.clusters?.length || age(inbox.fetchedAt) > FRESH_H) { process.stderr.write(`inbox/clusters.json is ${inbox.clusters?.length ? Math.round(age(inbox.fetchedAt)) + "h old" : "empty"}; ignoring\n`); inbox = null; } } catch {}
const pick = live && inbox ? (Date.parse(live.fetchedAt) >= Date.parse(inbox.fetchedAt) ? live : inbox) : live || inbox;
if (!pick) { console.log("STOP: no clusters available. The live fetch failed and pipeline/inbox/clusters.json is missing or stale. Run the `fetch` GitHub Action (or fetch.mjs + cluster.mjs on a machine with internet) and try again. Do not write an edition."); process.exit(3); }
process.stderr.write(`using ${pick === live ? "live" : "inbox"} clusters fetched ${pick.fetchedAt}\n`);
await fs.mkdir(path.join(here, "out"), { recursive: true });
await fs.writeFile(path.join(here, "out/clusters.json"), JSON.stringify(pick, null, 1));
const { clusters, fetchedAt } = pick;
await fs.copyFile(path.join(here, "out/clusters.json"), path.join(here, "editions", `${date}.sources.json`));

const glossary = JSON.parse(await fs.readFile(path.join(here, "glossary.json"), "utf8"));
const prior = (await fs.readdir(path.join(here, "editions"))).filter(f => /^\d{4}-\d\d-\d\d\.mjs$/.test(f) && f < `${date}.mjs`).sort().reverse();
const prev = prior[0] ? (await import(pathToFileURL(path.join(here, "editions", prior[0])).href)).default : null;
const no = (prev?.no || 0) + 1;
const weekday = new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const out = [];
out.push(`# Dispatch editor's brief`);
out.push(`Write edition No. ${no} for ${date} (${weekday}) as pipeline/editions/${date}.mjs. Clusters fetched ${fetchedAt}.`);
out.push(`Sources snapshot saved to editions/${date}.sources.json (build.mjs fact-checks numbers against it).`);
if (prev) { out.push(`\n## Previous edition (No. ${prev.no}, ${prev.date}): say what's new if a story continues`); for (const s of prev.stories) out.push(`- ${s.place}: ${s.hed}`); }
out.push(`\n## Glossary terms that already exist (use {term} freely; define anything else in the edition)`);
out.push(Object.keys({ ...glossary, ...(prev?.glossary || {}) }).join(", "));
const tiers = { major: "MAJOR", significant: "Significant", minor: "minor", soft: "soft (sport/celebrity: skip)" };
out.push(`\n## Today's clusters, ranked by magnitude (independent outlets, countries, volume, speed)`);
out.push(`Lead with the top MAJOR cluster. Keep the order of magnitude; don't promote a minor story for variety. ${clusters.filter(c => c.tier === "major").length} major, ${clusters.filter(c => c.tier === "significant").length} significant today.`);
for (const c of clusters.slice(0, top)) {
  out.push(`\n### ${c.rank}. ${tiers[c.tier] || c.tier || ""} · ${c.sources.length} outlets from ${(c.countries || []).length || "?"} countries · ${c.count} items · newest ${c.newestHoursAgo}h ago\n[${c.sources.join(", ")}]`);
  for (const i of c.items.slice(0, 6)) out.push(`- ${i.source}: ${i.title} — ${(i.summary || "").replace(/\s+/g, " ").slice(0, 360)} <${i.url}>`);
}
console.log(out.join("\n"));
