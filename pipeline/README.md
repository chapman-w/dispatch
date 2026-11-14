# Dispatch news pipeline

Builds each day's edition from real reporting, with checks so that what the app shows is accurate.

```
fetch.mjs     14 vetted world-news RSS feeds → out/items.json            (headline, snippet, link only)
cluster.mjs   group items about the same event, rank by how many    → out/clusters.json, out/clusters.md
              independent outlets covered it
prepare.mjs   fetch + cluster + source snapshot, then print the      → editions/YYYY-MM-DD.sources.json
              editor's brief (what the daily Claude Code routine reads)
EDITOR.md     the editor's rules; the routine writes               → editions/YYYY-MM-DD.mjs
write.mjs     the same job through the API, if a key is set
build.mjs     verify every edition, then publish                    → ../editions.json (+ embeds in ../index.html)
```

Daily, with no API key: `node prepare.mjs`, write the edition, `node build.mjs`. With a key: `npm run daily`.

## Accuracy safeguards

- **Corroboration first.** Stories are ranked by the number of independent outlets covering them. A story one outlet reports ranks below one that ten outlets report.
- **Facts come from snippets.** The writer is told to use only the supplied headlines and snippets for what happened. Background goes in the "Catch me up" and "Why it matters" fields.
- **Automatic number fact-check.** `build.mjs` rejects an edition if a number in a headline, body or key figure doesn't appear in that day's saved source snippets (`editions/DATE.sources.json`). Background numbers an editor verified by hand go in a story's `verified` list. On its first run this caught "32 times more energy" and a "140k" that the sources wrote as "140,000".
- **Coordinates are checked against the land map**, so a story can't be pinned in the ocean.
- **Repair loop.** If verification fails, the errors go back to Claude once. If the edition still fails, it is saved as `.rejected` for a human to review, and nothing is published.
- **Every story links out** to the outlets it was built from. Articles are never copied.

## Scheduling it (free)

The app checks `editions.json` about 2.5 seconds after opening (and whenever it returns to the foreground) and offers to load anything newer. The native build reads it from GitHub Pages.

The daily writer is a **Claude Code routine**: a scheduled cloud session that runs on the Claude plan, so there is no API key and no per-call bill. Its prompt is short because the rules live in this repo:

1. The `fetch` GitHub Action (05:00 UTC) fetches and clusters the feeds and commits `pipeline/inbox/clusters.json`, because the routine's sandbox can't reach the news sites.
2. `cd pipeline && npm ci --omit=dev && node prepare.mjs` uses a live fetch if it works, else the inbox file (if under 20h old), snapshots the sources and prints the editor's brief. With no clusters it prints STOP and exits 3.
3. The session writes `editions/<date>.mjs` following `EDITOR.md`.
4. `node build.mjs` verifies and embeds. If it fails, the session fixes the edition or gives up (`.rejected`), and nothing is published.
5. It commits and pushes to `main`. The `pages` workflow then publishes `editions.json`.

`write.mjs` is the API-key alternative (about $0.15-0.25 a day on Opus 5.5) and is kept for when a key is wanted; the SDK is an optional dependency.

## Files

- `feeds.json`: the outlets, with the selection criteria written at the top. Only established straight-news newsrooms, mostly public broadcasters and papers of record. No state-controlled outlets, tabloids or strongly partisan sources, and the list is kept balanced across countries and politics. Re-check the criteria before adding a feed.
- `glossary.json`: shared definitions. Editions can add terms of their own.
- `editions/`: one module per day, plus the source snapshot it was checked against.
- `snapshot-from-xml.mjs`: builds a snapshot from raw saved feeds, used for editions written before the pipeline existed.
