// Step 1: pull every feed, normalise, keep the last N hours.
// usage: node fetch.mjs [--hours 30]   -> out/items.json
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFeed } from "./lib/rss.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const hours = Number(process.argv[process.argv.indexOf("--hours") + 1]) || 30;
const { feeds } = JSON.parse(await fs.readFile(path.join(here, "feeds.json"), "utf8"));
const cutoff = Date.now() - hours * 3600e3;

async function get(feed) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(feed.url, { signal: ctl.signal, headers: { "user-agent": "DispatchNewsBot/0.1 (+headline aggregation; links back to sources)", accept: "application/rss+xml, application/xml, text/xml, */*" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseFeed(xml).map(it => ({ ...it, source: feed.name, sourceId: feed.id, weight: feed.weight ?? 1, region: feed.region }));
    return { feed, items };
  } catch (e) {
    return { feed, items: [], error: String(e.message || e) };
  } finally { clearTimeout(timer); }
}

const results = await Promise.all(feeds.map(get));
const seen = new Set();
const items = [];
for (const r of results) for (const it of r.items) {
  const fresh = it.published ? Date.parse(it.published) >= cutoff : true; // undated items are kept; ranking discounts them
  const key = it.url.replace(/[?].*$/, "");
  if (!fresh || seen.has(key)) continue;
  // drop obvious non-news: live-blog shells, quizzes, podcasts, puzzles
  if (/^(live|watch|listen|quiz|podcast|video):?\s/i.test(it.title) || /crossword|wordle|horoscope/i.test(it.title)) continue;
  seen.add(key); items.push(it);
}

await fs.mkdir(path.join(here, "out"), { recursive: true });
await fs.writeFile(path.join(here, "out/items.json"), JSON.stringify({ fetchedAt: new Date().toISOString(), hours, items }, null, 1));
for (const r of results) console.log(`${r.error ? "✗" : "✓"} ${r.feed.name.padEnd(26)} ${String(r.items.length).padStart(3)} ${r.error ?? ""}`);
console.log(`\n${items.length} items from the last ${hours}h → out/items.json`);
