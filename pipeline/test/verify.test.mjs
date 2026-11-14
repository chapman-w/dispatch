// Tests for the edition verifier: a real edition must pass, and every kind of fabrication must fail.
// run: npm test   (node --test)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verifyEdition, properNouns, quotesIn, numbersIn } from "../lib/verify.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = "2026-11-10"; // a real edition that passed every check when it was published
const ed0 = (await import(pathToFileURL(path.join(here, "../editions", `${FIX}.mjs`)).href)).default;
const snap = JSON.parse(await fs.readFile(path.join(here, "../editions", `${FIX}.sources.json`), "utf8"));
const glossary = { ...JSON.parse(await fs.readFile(path.join(here, "../glossary.json"), "utf8")), ...ed0.glossary };
const LAND = Buffer.from((await fs.readFile(path.join(here, "../data/land.b64"), "utf8")).trim(), "base64");
const isLand = (lat, lon) => { const y = Math.min(179, Math.max(0, Math.floor(90 - lat))), x = ((Math.floor(lon + 180) % 360) + 360) % 360, i = y * 360 + x; return (LAND[i >> 3] >> (i & 7)) & 1; };

const clone = () => JSON.parse(JSON.stringify(ed0));
const run = (ed, s = snap) => verifyEdition(ed, s, glossary, { isLand });
const failsWith = (ed, re, s) => { const r = run(ed, s); assert.ok(r.errors.some(e => re.test(e)), `expected an error matching ${re}, got:\n${r.errors.join("\n") || "(none)"}`); return r; };

test("the published edition passes with no errors", () => {
  const r = run(ed0);
  assert.deepEqual(r.errors, []);
  for (const s of ed0.stories) assert.ok(r.stats[s.id].groundingAll >= 0.5, `${s.id} grounding ${r.stats[s.id].groundingAll}`);
});

test("without a snapshot, evidence checks are skipped and that is a warning", () => {
  const r = run(ed0, null);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some(w => /skipping every evidence check/.test(w)));
});

test("a number that isn't in any snippet is rejected", () => {
  const ed = clone(); ed.stories[1].body = ed.stories[1].body.replace("around 700", "around 9,400");
  failsWith(ed, /number "9400" isn't in any source snippet/);
});

test("a number in why/ctx only warns, and 'verified' silences it", () => {
  const ed = clone(); ed.stories[0].ctx += " About 83 rounds have been held.";
  let r = run(ed); assert.ok(r.warnings.some(w => /background number "83"/.test(w))); assert.deepEqual(r.errors, []);
  ed.stories[0].verified = ["83"]; r = run(ed); assert.ok(!r.warnings.some(w => /background number "83"/.test(w)));
});

test("an invented person in the body is rejected", () => {
  const ed = clone(); ed.stories[0].body += " Analyst Marguerite Oyelaran called the talks hollow.";
  failsWith(ed, /name "marguerite" isn't in any source snippet/);
  failsWith(ed, /name "oyelaran" isn't in any source snippet/);
});

test("an invented organisation acronym is rejected", () => {
  const ed = clone(); ed.stories[0].hed = "UNHCR brokers first joint talks since February";
  failsWith(ed, /name "unhcr" isn't in any source snippet/);
});

test("a misspelt name is rejected", () => {
  const ed = clone(); ed.stories[2].body = ed.stories[2].body.replace("Eisenkot", "Eisencott");
  failsWith(ed, /name "eisencott"/);
});

test("a fabricated quotation is rejected; a real one passes", () => {
  const ed = clone(); ed.stories[0].body += ' The US envoy said the sides were "closer than they have ever been".';
  failsWith(ed, /quote "closer than they have ever been" isn't verbatim/);
  assert.deepEqual(quotesIn('they said "very productive" and "a ceasefire is not on the table"'), ["a ceasefire is not on the table"]);
});

test("a source URL that isn't in the snapshot is rejected", () => {
  const ed = clone(); ed.stories[0].sources.push(["Reuters", "https://www.reuters.com/world/made-up-2026-11-10/"]);
  failsWith(ed, /source url is not in today's snapshot/);
});

test("a real URL attributed to the wrong outlet is rejected", () => {
  const ed = clone(); ed.stories[0].sources[0][0] = "Al Jazeera";
  failsWith(ed, /source "Al Jazeera" is actually BBC/);
});

test("a cited item older than 72h is rejected", () => {
  const s = JSON.parse(JSON.stringify(snap)); const url = ed0.stories[0].sources[0][1];
  for (const c of s.clusters) for (const i of c.items) if (i.url === url) i.published = "2026-11-01T08:00:00Z";
  failsWith(clone(), /older than the edition/, s);
});

test("a person in who's-who who isn't in the snippets is rejected", () => {
  const ed = clone(); ed.stories[0].people.push(["Lavinia Trost", "Spokesperson"]);
  failsWith(ed, /person "Lavinia Trost" isn't in any source snippet/);
});

test("a body written from general knowledge instead of the sources is rejected as ungrounded", () => {
  const ed = clone();
  ed.stories[0].hed = "Trade winds shift across the equatorial belt";
  ed.stories[0].body = "Meteorologists describe seasonal reversals in prevailing surface circulation, driven by differential heating of landmasses and oceans. Sailing vessels historically timed voyages to these patterns, and modern shipping lanes still reflect them.";
  failsWith(ed, /isn't grounded in the sources/);
});

test("a map pin in the ocean is rejected", () => {
  const ed = clone(); ed.stories[0].lat = -40; ed.stories[0].lon = -30; // South Atlantic
  failsWith(ed, /not near land/);
});

test("a glossary term without a definition is rejected", () => {
  const ed = clone(); ed.stories[0].body += " Observers cited the {Minsk framework}.";
  failsWith(ed, /glossary term "Minsk framework" has no definition/);
});

test("the lead must come from a top-tier cluster", () => {
  const ed = clone(); const r0 = run(ed0); // find the story from the lowest-ranked cluster and lead with it
  const low = ed.stories.filter(s => !s.lite)[r0.stats.ranks.indexOf(Math.max(...r0.stats.ranks.slice(0, -1)))];
  ed.stories = [low, ...ed.stories.filter(s => s !== low)];
  failsWith(ed, /lead story .* comes from cluster #\d+, but top-tier clusters/);
});

test("quiz shape is enforced", () => {
  const ed = clone(); ed.quiz[0].c = 7; failsWith(ed, /bad quiz item/);
  const ed2 = clone(); ed2.quiz.pop(); failsWith(ed2, /quiz needs 3 questions/);
});

test("basic shape: duplicate ids, unknown categories, missing fields", () => {
  const ed = clone(); ed.stories[1].id = ed.stories[0].id; failsWith(ed, /duplicate id/);
  const ed2 = clone(); ed2.stories[1].cat = "Gossip"; failsWith(ed2, /unknown category Gossip/);
  const ed3 = clone(); delete ed3.stories[1].why; failsWith(ed3, /missing why/);
});

test("helpers: numbers normalise words and thousands, proper nouns skip sentence starts and allowlist", () => {
  assert.deepEqual(numbersIn("Six killed, 140,000 fled in 2026, 3.5% up"), ["6", "140000", "3.5"]);
  assert.deepEqual(properNouns("Thousands marched. Prime Minister Donald Tusk spoke in Warsaw on Monday with the ANC."), ["donald", "tusk", "warsaw", "anc"]);
});
