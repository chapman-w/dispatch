// Step 2: group items about the same event, rank by independent coverage.
// usage: node cluster.mjs [--top 30]  -> out/clusters.json + out/clusters.md (human-readable digest)
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const top = Number(process.argv[process.argv.indexOf("--top") + 1]) || 30;
const { items, fetchedAt } = JSON.parse(await fs.readFile(path.join(here, "out/items.json"), "utf8"));

const STOP = new Set(("a an the and or but of to in on at for from by with as is are was were be been being it its this that these those has have had " +
  "will would could should may might can after before over under into about amid against between says said say new news latest live update updates " +
  "how why what who when where which more most than first last year years day days week weeks his her their our your they he she we you i not no " +
  "up out off one two three four five six seven eight nine ten world people us u.s uk").split(" "));
const words = s => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']s\b/g, "").match(/[a-z][a-z0-9-]{2,}/g) || [];
const stem = w => w.replace(/(ings?|ed|es|s)$/, "").slice(0, 9);
const entities = s => new Set((s.match(/\b[A-Z][a-zA-ZÀ-ſ-]{2,}(?:\s+[A-Z][a-zA-ZÀ-ſ-]{2,})*/g) || [])
  .map(e => e.toLowerCase()).filter(e => !STOP.has(e) && !/^(the|a|an|this|after|why|how|what|live|watch|new)$/.test(e)));

// document vectors (title counts double)
const docs = items.map(it => {
  const toks = [...words(it.title), ...words(it.title), ...words(it.summary)].filter(w => !STOP.has(w)).map(stem);
  const tf = new Map(); for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
  return { it, tf, ents: entities(it.title + " " + it.summary) };
});
const df = new Map(); for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
const N = docs.length;
for (const d of docs) {
  const v = new Map(); let norm = 0;
  for (const [t, c] of d.tf) { const w = (1 + Math.log(c)) * Math.log((N + 1) / (df.get(t) + 0.5)); v.set(t, w); norm += w * w; }
  norm = Math.sqrt(norm) || 1; for (const [t, w] of v) v.set(t, w / norm); d.v = v;
}
const cos = (a, b) => { let s = 0; const [x, y] = a.size < b.size ? [a, b] : [b, a]; for (const [t, w] of x) { const o = y.get(t); if (o) s += w * o; } return s; };
const entOverlap = (a, b) => { let n = 0; for (const e of a) if (b.has(e)) n++; return n; };
const sim = (a, b) => cos(a.v, b.v) + 0.08 * Math.min(3, entOverlap(a.ents, b.ents));

// average-linkage agglomerative clustering with a similarity floor
let clusters = docs.map(d => ({ docs: [d] }));
const T = 0.30;
for (let changed = true; changed;) {
  changed = false; let best = null;
  for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
    const A = clusters[i].docs, B = clusters[j].docs; if (A.length + B.length > 30) continue;
    let s = 0; for (const a of A) for (const b of B) s += sim(a, b); s /= A.length * B.length;
    if (s > T && (!best || s > best.s)) best = { i, j, s };
  }
  if (best) { clusters[best.i].docs.push(...clusters[best.j].docs); clusters.splice(best.j, 1); changed = true; }
}

// second pass: merge clusters that share 2+ *rare* named entities (e.g. "new zealand" + "national"),
// so one event split across wording styles comes back together; common names (trump, israel) don't count
const entDf = new Map(); for (const d of docs) for (const e of d.ents) entDf.set(e, (entDf.get(e) || 0) + 1);
const rare = e => (entDf.get(e) || 0) / N < 0.04;
const cEnts = c => { const m = new Map(); for (const d of c.docs) for (const e of d.ents) if (rare(e)) m.set(e, (m.get(e) || 0) + 1); return new Set([...m.entries()].filter(x => x[1] >= Math.min(2, c.docs.length)).map(x => x[0])); };
for (let changed = true; changed;) {
  changed = false;
  outer: for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
    const a = cEnts(clusters[i]), b = cEnts(clusters[j]); let n = 0; for (const e of a) if (b.has(e)) n++;
    let s = 0; for (const x of clusters[i].docs) for (const y of clusters[j].docs) s += cos(x.v, y.v); s /= clusters[i].docs.length * clusters[j].docs.length;
    if ((n >= 2 && s > 0.12) || (n >= 1 && s > 0.2)) { clusters[i].docs.push(...clusters[j].docs); clusters.splice(j, 1); changed = true; break outer; }
  }
}

const now = Date.parse(fetchedAt);
const ranked = clusters.map(c => {
  const its = c.docs.map(d => d.it);
  const sources = [...new Set(its.map(i => i.source))];
  const weight = sources.reduce((a, s) => a + (its.find(i => i.source === s).weight || 1), 0);
  const newest = Math.max(...its.map(i => i.published ? Date.parse(i.published) : now - 20 * 3600e3));
  const ageH = (now - newest) / 3600e3;
  const tf = new Map(); for (const d of c.docs) for (const [t, w] of d.v) tf.set(t, (tf.get(t) || 0) + w);
  const keywords = [...tf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
  const ents = new Map(); for (const d of c.docs) for (const e of d.ents) ents.set(e, (ents.get(e) || 0) + 1);
  const entities = [...ents.entries()].filter(e => e[1] > 1 || c.docs.length === 1).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  // coverage dominates; freshness decays over ~a day; soft-news and sport are penalised
  const soft = /football|soccer|cricket|tennis|nba|nfl|premier league|celebrity|royal|recipe|fashion week|box office/i.test(its.map(i => i.title).join(" "));
  const score = weight * 10 * Math.exp(-ageH / 30) * (soft ? 0.4 : 1) + Math.min(its.length, 8);
  return { score: +score.toFixed(2), sources, count: its.length, newestHoursAgo: +ageH.toFixed(1), keywords, entities, soft,
    items: its.sort((a, b) => (b.weight || 1) - (a.weight || 1)).map(({ title, summary, url, source, published }) => ({ title, summary, url, source, published })) };
}).sort((a, b) => b.score - a.score);

const out = ranked.slice(0, top).map((c, i) => ({ rank: i + 1, ...c }));
await fs.writeFile(path.join(here, "out/clusters.json"), JSON.stringify({ fetchedAt, clusters: out }, null, 1));
const md = out.map(c => `## ${c.rank}. ${c.items[0].title}\nscore ${c.score} · ${c.sources.length} outlets (${c.sources.join(", ")}) · newest ${c.newestHoursAgo}h ago${c.soft ? " · soft" : ""}\nentities: ${c.entities.join(", ")}\n` +
  c.items.map(i => `- [${i.source}] ${i.title} — ${i.summary.slice(0, 220)} <${i.url}> (${i.published ?? "undated"})`).join("\n")).join("\n\n");
await fs.writeFile(path.join(here, "out/clusters.md"), `# Clusters · fetched ${fetchedAt}\n\n${md}\n`);
console.log(out.slice(0, 20).map(c => `${String(c.rank).padStart(2)}. [${c.sources.length} outlets, ${c.newestHoursAgo}h] ${c.items[0].title.slice(0, 90)}`).join("\n"));
