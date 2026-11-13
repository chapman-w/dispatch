// Step 3: Claude writes the edition from today's clusters, then build.mjs verifies it.
// If verification fails, the errors go back to Claude once for a repair pass.
// usage: node write.mjs [--date 2026-11-09] [--dry]   (needs ANTHROPIC_API_KEY or an `ant auth login` profile)
//   --dry prints the prompt size and exits without calling the API.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const date = arg("--date") || new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry");

const { clusters, fetchedAt } = JSON.parse(await fs.readFile(path.join(here, "out/clusters.json"), "utf8"));
const glossary = JSON.parse(await fs.readFile(path.join(here, "glossary.json"), "utf8"));
const prior = (await fs.readdir(path.join(here, "editions"))).filter(f => /^\d{4}-\d\d-\d\d\.mjs$/.test(f) && f < `${date}.mjs`).sort().reverse();
const prev = prior[0] ? (await import(pathToFileURL(path.join(here, "editions", prior[0])).href)).default : null;
const no = (prev?.no || 0) + 1;

// ---- output schema (mirrors what the app renders; build.mjs re-checks everything) ----
const Fig = z.object({
  type: z.enum(["big", "seats", "grid", "scale", "dots"]),
  n: z.string().describe("The headline figure exactly as displayed, e.g. \"6\", \"$20m\", \"70,000\". Must come from the sources."),
  u: z.string().describe("One short sentence explaining the figure."),
  total: z.number().nullable(), mark: z.number().nullable(), pct: z.number().nullable(),
  v: z.number().nullable(), max: z.number().nullable(), count: z.number().nullable(), per: z.number().nullable(),
});
const Story = z.object({
  id: z.string().describe("2-3 lowercase letters, unique in this edition"),
  place: z.string().describe("Country or territory, shown huge"), city: z.string(),
  cat: z.enum(["Politics", "Conflict", "War", "Security", "Disaster", "Migration", "Economy", "Society", "Rights", "Science", "Climate", "Health", "Tech", "Lighter"]),
  lat: z.number(), lon: z.number(),
  lite: z.boolean().describe("true only for the single closing lighter story"),
  short: z.string().describe("Cover line, max 45 characters"),
  hed: z.string().describe("Plain-English headline, max 75 characters"),
  body: z.string().describe("What happened: 2-3 sentences, max 75 words. Wrap glossary terms as {term} or {shown text|term}."),
  why: z.string().describe("Why it matters, 1-2 sentences"),
  ctx: z.string().describe("Background for someone new to the story, 1-2 sentences"),
  fig: Fig.nullable(),
  people: z.array(z.object({ name: z.string(), role: z.string() })),
  sources: z.array(z.object({ name: z.string(), url: z.string() })).describe("Every outlet whose snippet you used, with the exact URL from the input"),
  verified: z.array(z.string()).describe("Background numbers that are not in the snippets but are well-established facts (rare; leave empty when unsure)"),
});
const Edition = z.object({
  line: z.string().describe("One-sentence summary of the edition; may wrap one place name in <em></em>"),
  stories: z.array(Story),
  quiz: z.array(z.object({ q: z.string(), a: z.array(z.string()), c: z.number().describe("index of the correct answer"), x: z.string().describe("Explanation, starting with the answer in <b></b>") })),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })).describe("Definitions for any {term} you used that is not already in the existing glossary"),
});

const SYSTEM = `You are the editor of Dispatch, a five-minute daily world-news edition for people who don't follow the news closely.

You receive clusters of headlines and short snippets from many outlets, ranked by how many independent outlets covered each event. Write today's edition from them.

Choosing stories
- Pick 6 or 7 stories that matter most globally, favouring clusters covered by more outlets. Spread across regions where the news allows.
- Merge clusters that are clearly the same event. Skip sport, celebrity and opinion pieces.
- End with exactly one "Lighter" story (lite: true): something curious or warm, still real news from the input.

Accuracy rules (these are checked automatically and the edition is rejected if they fail)
- Every factual claim in hed, body and fig must be supported by the snippets provided. Never add facts from memory to those fields.
- Every number in hed, body, fig.n and fig.u must appear in a snippet, written the same way (write "140,000", not "140k").
- When outlets disagree, say so or attribute the claim ("Houthi officials say...").
- ctx and why may use well-established background knowledge, stated carefully. Put any background number used in fig into "verified".
- Coordinates: the city where the story happened. Use a land point.
- sources: only URLs that appear in the input, for the outlets you relied on.

Style
- Plain, warm, specific English. Short sentences. Explain jargon with {glossary} terms instead of assuming knowledge.
- No sensationalism, no editorialising beyond "why it matters".
- Quiz: three questions answerable from today's stories, with three options each and plausible wrong answers.`;

const input = {
  date, editionNumber: no, fetchedAt,
  previousEdition: prev ? { date: prev.date, stories: prev.stories.map(s => ({ place: s.place, hed: s.hed })) } : null,
  existingGlossaryTerms: Object.keys(glossary),
  clusters: clusters.slice(0, 30).map(c => ({ rank: c.rank, outlets: c.sources, items: c.items.slice(0, 8).map(i => ({ source: i.source, title: i.title, snippet: i.summary, url: i.url, published: i.published })) })),
};
const userMsg = `Today's clusters (JSON):\n\n${JSON.stringify(input)}\n\nWrite edition No. ${no} for ${date}. If a story continues from the previous edition, say what's new.`;
if (dry) { console.log(`prompt ≈ ${Math.round((SYSTEM.length + userMsg.length) / 4)} tokens; would write editions/${date}.mjs`); process.exit(0); }

const client = new Anthropic();
const messages = [{ role: "user", content: userMsg }];

async function ask() {
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    system: SYSTEM,
    messages,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: zodOutputFormat(Edition) },
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error(`model declined: ${msg.stop_details?.category ?? "unknown"}`);
  if (msg.stop_reason === "max_tokens") throw new Error("ran out of output tokens");
  if (!msg.parsed_output) throw new Error("no parsed output");
  messages.push({ role: "assistant", content: msg.content });
  return msg.parsed_output;
}

function toFile(e) {
  const ed = {
    no, date, line: e.line,
    stories: e.stories.map(s => {
      const o = { id: s.id, place: s.place, city: s.city, cat: s.cat, lat: s.lat, lon: s.lon, short: s.short, hed: s.hed, body: s.body, why: s.why, ctx: s.ctx,
        sources: s.sources.map(x => [x.name, x.url]) };
      if (s.lite) o.lite = true;
      if (s.fig) o.fig = Object.fromEntries(Object.entries(s.fig).filter(([, v]) => v !== null));
      if (s.people.length) o.people = s.people.map(p => [p.name, p.role]);
      if (s.verified.length) o.verified = s.verified;
      return o;
    }),
    quiz: e.quiz, glossary: Object.fromEntries(e.glossary.map(g => [g.term, g.definition])),
  };
  return `// Edition No. ${no} · ${date} · written by claude-opus-5-5 from clusters fetched ${fetchedAt}\nexport default ${JSON.stringify(ed, null, 1)};\n`;
}

const file = path.join(here, "editions", `${date}.mjs`);
await fs.copyFile(path.join(here, "out/clusters.json"), path.join(here, "editions", `${date}.sources.json`));
for (let attempt = 1; attempt <= 2; attempt++) {
  console.log(`writing edition No. ${no} (attempt ${attempt})…`);
  await fs.writeFile(file, toFile(await ask()));
  try { const { stdout } = await run("node", [path.join(here, "build.mjs"), "--no-embed"]); console.log(stdout); console.log(`✓ editions/${date}.mjs passed verification`); process.exit(0); }
  catch (e) {
    const report = (e.stdout || String(e)).split("\n").filter(l => l.includes("✗")).join("\n");
    console.log(report);
    if (attempt === 2) { await fs.rename(file, file + ".rejected"); console.log("✗ still failing after repair; saved as .rejected for a human editor"); process.exit(1); }
    messages.push({ role: "user", content: `The automatic checker rejected the edition:\n${report}\n\nFix every listed problem using only the snippets provided, and return the full corrected edition.` });
  }
}
