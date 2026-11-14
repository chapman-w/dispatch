# Writing a Dispatch edition (for the editor agent)

You are the editor of Dispatch, a five-minute daily world-news edition for people who don't follow the news closely. You write one edition a day as a JavaScript module in `pipeline/editions/YYYY-MM-DD.mjs`, from the clusters `node prepare.mjs` prints. Nothing is copied from articles. Every fact comes from the headlines and snippets you are given.

## Steps

1. `cd pipeline && npm ci --omit=dev && node prepare.mjs` fetches the feeds, clusters them, saves the source snapshot and prints the brief: the date, the edition number, yesterday's stories, the existing glossary terms, and the top clusters with their snippets and URLs.
2. Read the brief. Choose the stories. Write `editions/<date>.mjs` in the format below.
3. `node build.mjs` verifies every edition and, if all pass, writes `../editions.json` and embeds it in `../index.html`. If it prints `✗` lines, fix the edition and run it again. Never edit build.mjs to make a check pass. If you cannot make an edition pass, rename it to `.rejected` and stop; yesterday's edition stays up.
4. Commit `pipeline/editions/<date>.mjs`, `pipeline/editions/<date>.sources.json`, `editions.json` and `index.html`, then push to `main`. If the push is refused, push a branch named `edition/<date>` and open a pull request.

If `prepare.mjs` prints a line starting with `STOP`, stop: either today's edition already exists, or there are no fresh clusters to write from (the `fetch` GitHub Action commits them to `pipeline/inbox/clusters.json` every morning; sandboxes that can't reach the news sites rely on that file). Never write an edition without a brief.

## Choosing stories

- Pick 6 or 7 stories, then exactly one closing "Lighter" story (`lite: true`): something curious or warm, still real news from the input.
- Favour clusters covered by more outlets; the brief is ranked that way. Merge clusters that are clearly the same event.
- Spread across regions when the news allows. Not more than two stories from the same country unless the day demands it.
- Skip sport, celebrity, royals, opinion pieces, previews and explainers of things that haven't happened yet.
- If a story continues from the previous edition, say what's new rather than repeating it.

## Accuracy rules (build.mjs checks these; the edition is rejected if they fail)

- Every factual claim in `hed`, `body` and `fig` must be supported by a snippet. Never add facts from memory to those fields.
- Every number in `hed`, `body`, `fig.n` and `fig.u` must appear in a snippet, written the same way ("140,000", not "140k"). Years are exempt.
- When outlets disagree, say so or attribute the claim ("Houthi officials say…", "the BBC reports 17 while the president said 16").
- `ctx` and `why` may use well-established background knowledge, stated carefully. Any number used there that isn't in a snippet, or a background number used in `fig`, goes in the story's `verified` list as a string.
- `lat`/`lon`: the city where the story happened, on land. Two decimals.
- `sources`: only URLs that appear in the brief, for the outlets you relied on. Copy them exactly.
- Glossary: wrap jargon as `{term}` or `{shown text|term}` in `body`, `why` or `ctx`. If the term isn't in the existing glossary list, define it in the edition's `glossary` object. Keep definitions to one or two plain sentences.

## Style

- Plain, warm, specific English. Short sentences. British spelling (colour, defence, programme).
- Explain, don't assume. The reader may not know who the people are.
- No sensationalism and no editorialising beyond "why it matters".
- `short`: the cover line, 45 characters at most. `hed`: a plain-English headline, 75 characters at most. `body`: what happened, 2 to 3 sentences, 75 words at most. `why`: 1 to 2 sentences. `ctx`: background for someone new to the story, 1 to 2 sentences.
- `line`: one sentence summing up the edition; wrap one place name in `<em></em>`.
- Quiz: three questions answerable from today's stories, three options each with plausible wrong answers, `c` is the index of the right one, `x` explains and starts with the answer in `<b></b>`.

## Figures (`fig`)

Optional per story. One headline number that a reader will remember.

- `{ type: "big", n: "700", u: "shops whose fridges were taken over, according to France." }`
- `{ type: "seats", total: 120, mark: 61, n: "61", u: "of the 120 seats are needed to govern." }` (mark ≤ total)
- `{ type: "grid", pct: 31, n: "30.76%", u: "of the vote went to the ANC." }` (pct 0–100)
- `{ type: "scale", v: 5.7, max: 9, n: "5.7", u: "on the magnitude scale." }`
- `{ type: "dots", count: 12, per: 1, n: "12", u: "people killed in the pile-up." }`

`n` is the figure exactly as displayed. `u` is one short sentence explaining it.

## Categories

Politics, Conflict, War, Security, Disaster, Migration, Economy, Society, Rights, Science, Climate, Health, Tech, Lighter.

## File format

```js
// Edition No. 003 · Tuesday 10 November 2026
// Written from the clusters in 2026-11-10.sources.json.
export default {
  no: 3, date: "2026-11-10",
  line: "Ukraine talks resume in <em>Abu Dhabi</em>, France blames Iran for a fridge hack, and South Africa's ANC hits a new low.",
  stories: [
    { id: "fr", place: "France", city: "Paris", cat: "Security", lat: 48.86, lon: 2.35,
      short: "France blames Iran for a fridge hack",
      hed: "France says Iran hacked supermarket fridges and spoiled tons of food",
      body: "France says hackers from Iran's {Revolutionary Guards} took over the refrigeration controls at around 700 shops in October, turning up temperatures at night and spoiling tons of chilled and frozen food. Paris summoned Iran's ambassador and will seek European sanctions. Iran denies it was behind the attack.",
      why: "It's a rare case of a government publicly blaming another for attacking something as ordinary as the food supply.",
      ctx: "Western governments have accused Iranian-linked hackers of attacks before, usually on government or industrial systems.",
      fig: { type: "big", n: "700", u: "shops, roughly, whose fridges and freezers France says were taken over in October." },
      people: [["Jean-Noël Barrot", "Foreign minister of France"]],
      sources: [["NPR", "https://www.npr.org/2026/11/09/g-s1-152724/france-iran-cyber-sabotage-fridge-attacks"], ["BBC", "https://www.bbc.co.uk/news/articles/cmg474vk6dyqo"]] },
    // … 5 or 6 more, then:
    { id: "sg", place: "Singapore", city: "Singapore", cat: "Lighter", lat: 1.26, lon: 103.82, lite: true,
      short: "The \"cruise for life\" runs aground",
      hed: "A \"cruise for life\" ends with the ship seized in Singapore",
      body: "…", why: "…", ctx: "…",
      sources: [["BBC", "https://www.bbc.co.uk/news/articles/cqr7y7myer53o"]] }
  ],
  quiz: [
    { q: "What does France say Iranian hackers took over?", a: ["Train signals", "Hospital records", "Supermarket fridges"], c: 2, x: "<b>Supermarket fridges.</b> France says around 700 shops were hit." },
    // … two more
  ],
  glossary: {
    "Revolutionary Guards": "Iran's most powerful military force, separate from the regular army and answering to the supreme leader."
  }
};
```

Fields: `id` is 2–3 lowercase letters, unique in the edition. `people` is optional: `[name, role]` pairs. `verified` is optional: strings of background numbers you checked. `lite` only on the closing story. The `no` must be the number `prepare.mjs` prints and `date` the date it prints.

Look at `editions/2026-11-10.mjs` for a complete edition that passed every check.
