// Tests for ranking: a story the whole world is covering must outrank a small local one,
// sport is pushed down, and tiers are assigned the way EDITOR.md describes them.
// cluster.mjs is a script, so the test runs it on a synthetic items.json in a scratch copy.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const run = promisify(execFile);
const now = Date.parse("2026-11-14T06:00:00Z");
const ago = h => new Date(now - h * 3600e3).toISOString();
const item = (source, region, title, summary, h = 2, weight = 1) => ({ title, summary, url: `https://${source.toLowerCase().replace(/\W/g, "")}.example/${title.toLowerCase().replace(/\W+/g, "-")}`, source, region, weight, published: ago(h) });

async function cluster(items) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dispatch-cluster-"));
  await fs.mkdir(path.join(dir, "out"));
  await fs.copyFile(path.join(here, "../cluster.mjs"), path.join(dir, "cluster.mjs"));
  await fs.writeFile(path.join(dir, "out/items.json"), JSON.stringify({ fetchedAt: new Date(now).toISOString(), items }));
  await run("node", [path.join(dir, "cluster.mjs"), "--top", "40"], { cwd: dir });
  return JSON.parse(await fs.readFile(path.join(dir, "out/clusters.json"), "utf8")).clusters;
}

const quake = (src, region, h) => item(src, region, `Powerful earthquake strikes central Chile, hundreds feared dead`, `A magnitude 8.1 earthquake hit near Santiago overnight. Rescue teams are searching collapsed buildings and the death toll is rising.`, h);
const council = (src, region, h) => item(src, region, `Council approves new cycle lane in Leeds suburb`, `Leeds city council voted to add a cycle lane on Otley Road after a year of consultation.`, h);
const derby = (src, region, h) => item(src, region, `Premier League: late winner settles Manchester derby`, `A stoppage-time goal decided the football derby at Old Trafford.`, h);

test("a worldwide story outranks a fresher local one", async () => {
  const items = [
    quake("BBC", "UK", 6), quake("NPR", "US", 5), quake("DW", "Germany", 7), quake("France 24", "France", 6), quake("The Hindu", "India", 4),
    quake("Japan Times", "Japan", 5), quake("Guardian", "UK", 6), quake("Euronews", "EU", 5), quake("Africanews", "Africa", 6), quake("Sky News", "UK", 7),
    council("Guardian", "UK", 0.5), council("Sky News", "UK", 0.3),
  ];
  const c = await cluster(items);
  assert.match(c[0].items[0].title, /earthquake/);
  assert.equal(c[0].tier, "major");
  assert.ok(c[0].sources.length >= 9, `quake cluster should hold the outlets, got ${c[0].sources.length}`);
  const local = c.find(x => /cycle lane/.test(x.items[0].title));
  assert.equal(local.tier, "minor");
  assert.ok(c[0].score > local.score * 5, `global ${c[0].score} should dwarf local ${local.score}`);
});

test("coverage from many countries beats the same number of outlets from one country", async () => {
  const a = ["BBC", "Guardian", "Sky News", "Financial Times"].map(s => item(s, "UK", "Rail strike halts trains across Britain", "Unions walked out over pay, stopping most services.", 3));
  const b = [["NPR", "US"], ["DW", "Germany"], ["The Hindu", "India"], ["Japan Times", "Japan"]].map(([s, r]) => item(s, r, "Central banks coordinate surprise rate cut", "Four central banks cut rates together to calm markets.", 3));
  const c = await cluster([...a, ...b]);
  assert.match(c[0].items[0].title, /rate cut/);
});

test("sport is pushed down and tagged soft even with wide coverage", async () => {
  const items = [
    ...["BBC", "Guardian", "Sky News", "France 24", "DW", "Euronews"].map((s, i) => derby(s, ["UK", "UK", "UK", "France", "Germany", "EU"][i], 2)),
    ...["BBC", "NPR", "DW"].map((s, i) => item(s, ["UK", "US", "Germany"][i], "Parliament passes emergency budget after talks collapse", "Lawmakers approved the budget late on Thursday.", 4)),
  ];
  const c = await cluster(items);
  const sport = c.find(x => /derby/.test(x.items[0].title)), budget = c.find(x => /budget/.test(x.items[0].title));
  assert.equal(sport.tier, "soft");
  assert.ok(budget.score > sport.score, `budget ${budget.score} should outrank sport ${sport.score}`);
});

test("tiers follow the documented thresholds", async () => {
  const mk = (n, title, regions) => Array.from({ length: n }, (_, i) => item(`Outlet${i}`, regions[i % regions.length], title, `${title}. Officials confirmed the details on Thursday.`, 3));
  const c = await cluster([
    ...mk(6, "Dam collapse floods three provinces in Vietnam", ["UK", "US", "Germany", "France", "India", "Japan"]),
    ...mk(3, "Mayor of Lyon resigns over expenses", ["France", "UK", "EU"]),
    ...mk(1, "Village fete raises record sum in Dorset", ["UK"]),
  ]);
  const by = re => c.find(x => re.test(x.items[0].title));
  assert.equal(by(/dam collapse/i).tier, "major");
  assert.equal(by(/mayor of lyon/i).tier, "significant");
  assert.equal(by(/village fete/i).tier, "minor");
});
