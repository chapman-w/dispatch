// Minimal, dependency-free RSS 2.0 / RDF / Atom parser.
// Feeds are untrusted input: we only extract plain text fields and http(s) links.

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };

export function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}

export function clean(s = "") {
  // decode twice: some feeds double-encode HTML inside descriptions
  return decode(decode(s).replace(/<[^>]+>/g, " ")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

function link(block) {
  const atom = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  const rss = tag(block, "link") || tag(block, "guid");
  const about = block.match(/rdf:about=["']([^"']+)["']/i);
  const raw = decode((rss && /^https?:/.test(decode(rss).trim()) ? rss : "") || (atom && atom[1]) || (about && about[1]) || "").trim();
  return /^https?:\/\//i.test(raw) ? raw.split("#")[0] : "";
}

export function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(b => {
    const title = clean(tag(b, "title"));
    const summary = clean(tag(b, "description") || tag(b, "summary") || tag(b, "content:encoded") || tag(b, "content")).slice(0, 600);
    const when = clean(tag(b, "pubDate") || tag(b, "dc:date") || tag(b, "published") || tag(b, "updated"));
    const t = Date.parse(when);
    return { title, summary, url: link(b), published: Number.isFinite(t) ? new Date(t).toISOString() : null };
  }).filter(x => x.title && x.url);
}
