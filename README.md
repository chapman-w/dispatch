# Dispatch

The world in five minutes. One daily news edition for people who don't follow the news: seven stories explained from zero, three quick questions, and a globe of where it all happened.

```
index.html        the app (single file; web and iOS share it)
editions.json     every verified edition, embedded in the app and served from GitHub Pages
pipeline/         fetch → cluster → write → verify. Builds each day's edition from 14 vetted newsrooms
app/              the iOS wrapper (Capacitor) and App Store material
font/             Dispatch Dot, the app's display face
.github/          Pages deploy and the fact-check on every push
```

## How a day works

1. **05:30 UTC** a scheduled Claude Code routine (runs on the Claude plan, no API key) clones this repo, runs `pipeline/prepare.mjs` (fetch + cluster + source snapshot), writes `pipeline/editions/<date>.mjs` following `pipeline/EDITOR.md`, runs `build.mjs`, and pushes.
2. `build.mjs` fact-checks every number against the saved source snippets and every map pin against the land map. If anything fails, nothing is published and yesterday's edition stays up.
3. The push triggers the Pages deploy: `https://chapman-w.github.io/dispatch/` (web app) and `/editions.json`.
4. The iOS app fetches `editions.json` when opened and when it comes to the foreground, and shows "New edition · tap to load". A local notification fires at the time the reader chose.

## Web

Open https://chapman-w.github.io/dispatch/ on a phone. The same page is published as a Claude artifact for previews.

## iOS

See `app/README.md`.
