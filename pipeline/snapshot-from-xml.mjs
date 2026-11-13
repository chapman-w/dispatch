// Build a .sources.json snapshot from saved raw feed XML (for editions written before the pipeline existed).
// usage: node snapshot-from-xml.mjs <dir-with-xml> <out.json>
import fs from "node:fs/promises"; import path from "node:path"; import { parseFeed } from "./lib/rss.mjs";
const [dir, out] = process.argv.slice(2); const items = [];
for (const f of (await fs.readdir(dir)).filter(f => f.endsWith(".xml"))) for (const it of parseFeed(await fs.readFile(path.join(dir, f), "utf8"))) items.push({ ...it, source: f.replace(".xml", "") });
await fs.writeFile(out, JSON.stringify({ fetchedAt: "2026-11-07T23:59:00Z", clusters: [{ items }] }));
console.log(items.length, "items →", out);
