// Edition verification: every check that stands between a written edition and the app.
// Pure function, so build.mjs and the tests share it. Errors block publishing; warnings print.
//
// What it guards against (each has a test in test/verify.test.mjs):
//   fabricated numbers      every number in hed/body/fig must appear in the day's source snippets
//   fabricated names        every proper noun and acronym in hed/body must appear in the snippets
//   fabricated quotes       anything in quotation marks (3+ words) must appear verbatim in the snippets
//   fabricated sources      every source URL must be an item in the snapshot, from the outlet named
//   stale sources           every cited item must have been published within 72h of the edition
//   unrelated text          the words of hed+body must mostly come from the story's own sources
//   invented people         every "who's who" name must appear in the snippets
//   misranked editions      the lead must come from a top-tier cluster; big rank inversions warn
//   broken map pins         coordinates must be near land
//   loose ends              glossary terms defined, quiz sane, categories known, ids unique

export const CATS = ["Politics", "Conflict", "War", "Security", "Disaster", "Migration", "Economy", "Society", "Rights", "Science", "Climate", "Health", "Tech", "Lighter"];

const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
export const norm = s => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|twenty|thirty|forty|fifty|hundred)\b/g, w => NUMW[w]).replace(/(\d),(\d{3})/g, "$1$2");
const plain = s => String(s).replace(/\{([^}|]+)(\|[^}]+)?\}/g, (_, a, b) => b ? b.slice(1) : a).replace(/<[^>]+>/g, "");
export const numbersIn = s => (norm(plain(s)).match(/\d+(?:\.\d+)?/g) || []).filter(n => !/^(19|20)\d\d$/.test(n)); // years are background

// capitalised words and acronyms, skipping the first word of each sentence (it's capitalised anyway)
const ALLOW = new Set(("monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december " +
  "mr mrs ms dr sir prime minister president secretary foreign defence defense interior chancellor king queen prince princess pope " +
  "north south east west northern southern eastern western central " +
  "congress house senate parliament government party republican republicans democrat democrats labour conservative conservatives " +
  "world war second first ii iii street square city state states kingdom union republic island islands coast gulf sea ocean bay river mount " +
  "new york times guardian bbc npr pbs newshour dw rfi sky euronews hindu japan africanews financial ft reuters ap " +
  "a an the and or of in on at to for by with from as is it its i").split(" "));
// demonyms: "Turkish" is fine if the snippets say "Turkey". Irregular ones are listed; the rest are
// matched by stripping the suffix and looking for the stem at the start of a word in the corpus.
const DEMONYM = { french: "france", dutch: "netherlands", spanish: "spain", swiss: "switzerland", danish: "denmark", polish: "poland", finnish: "finland", swedish: "sweden", irish: "ireland", welsh: "wales", scottish: "scotland", greek: "greece", british: "britain|uk|united kingdom|briton", filipino: "philippines", thai: "thailand", icelandic: "iceland", cypriot: "cyprus", maltese: "malta", lebanese: "lebanon", chinese: "china", japanese: "japan", portuguese: "portugal", vietnamese: "vietnam", sudanese: "sudan", congolese: "congo", burmese: "myanmar|burma", nepalese: "nepal", taiwanese: "taiwan", senegalese: "senegal", emirati: "emirates|uae", saudi: "saudi", israeli: "israel", iraqi: "iraq", iranian: "iran", pakistani: "pakistan", afghan: "afghanistan", kurdish: "kurd", turkish: "turkey|turkiye", german: "germany", american: "america|united states|\\bus\\b|u.s", european: "europe", russian: "russia", ukrainian: "ukraine", palestinian: "palestin", korean: "korea", mexican: "mexico", canadian: "canada", australian: "australia", indian: "india", nigerian: "nigeria", kenyan: "kenya", ethiopian: "ethiopia", egyptian: "egypt", libyan: "libya", syrian: "syria", yemeni: "yemen", somali: "somalia", malian: "mali", chadian: "chad", argentine: "argentina", argentinian: "argentina", brazilian: "brazil", chilean: "chile", peruvian: "peru", colombian: "colombia", venezuelan: "venezuela", cuban: "cuba", haitian: "haiti", hungarian: "hungary", romanian: "romania", bulgarian: "bulgaria", serbian: "serbia", croatian: "croatia", norwegian: "norway", belgian: "belgium", austrian: "austria", czech: "czech", slovak: "slovakia", lithuanian: "lithuania", latvian: "latvia", estonian: "estonia", georgian: "georgia", armenian: "armenia", azerbaijani: "azerbaijan", kazakh: "kazakhstan", uzbek: "uzbekistan", mongolian: "mongolia", indonesian: "indonesia", malaysian: "malaysia", singaporean: "singapore", cambodian: "cambodia", bangladeshi: "bangladesh", moroccan: "morocco", algerian: "algeria", tunisian: "tunisia", ghanaian: "ghana", ugandan: "uganda", tanzanian: "tanzania", zimbabwean: "zimbabwe", zambian: "zambia", mozambican: "mozambique", angolan: "angola", rwandan: "rwanda", malawian: "malawi", namibian: "namibia", paraguayan: "paraguay", uruguayan: "uruguay", bolivian: "bolivia", ecuadorian: "ecuador", guatemalan: "guatemala", honduran: "honduras", nicaraguan: "nicaragua", panamanian: "panama", jamaican: "jamaica", dominican: "dominican", qatari: "qatar", kuwaiti: "kuwait", omani: "oman", bahraini: "bahrain", jordanian: "jordan", houthi: "houthi", european: "europe", african: "africa", asian: "asia", latin: "latin", arab: "arab", catholic: "catholic|pope|vatican", christian: "christian", muslim: "muslim|islam", jewish: "jewish|jew" };
export function nameInCorpus(pn, corpus) {
  const forms = [pn, pn.replace(/s$/, ""), pn + "s"];
  if (forms.some(f => corpus.includes(f))) return true;
  if (DEMONYM[pn]) return new RegExp(DEMONYM[pn]).test(corpus);
  const m = pn.match(/^([a-z]{4,})(ish|ians?|eans?|ese|ic|i|ans?|ns?)$/);
  if (m && new RegExp(`\\b${m[1]}`).test(corpus)) return true;
  return false;
}
export function properNouns(text) {
  const out = new Set();
  for (const sentence of plain(text).split(/(?<=[.!?])\s+/)) {
    const toks = sentence.split(/\s+/);
    toks.forEach((raw, i) => {
      const w = raw.replace(/^[("'“‘]+|[)"'”’.,;:!?]+$/g, "").replace(/['’]s$/, "");
      if (!w) return;
      const acronym = /^[A-Z]{2,6}s?$/.test(w);
      if (!acronym && (i === 0 || !/^[A-Z][a-zA-ZÀ-ſ'-]+$/.test(w))) return;
      const k = norm(w);
      if (ALLOW.has(k) || k.length < 2) return;
      out.add(k);
    });
  }
  return [...out];
}
export const quotesIn = text => (plain(text).match(/["“]([^"“”]{6,}?)["”]/g) || []).map(q => norm(q.slice(1, -1)).replace(/[.,;:!?]+$/, "").trim()).filter(q => q.split(/\s+/).length >= 3);

const STOP = new Set(("a an the and or but of to in on at for from by with as is are was were be been being it its this that these those has have had will would could should may might can " +
  "after before over under into about between says said say more most than first last his her their our your they he she we you not no up out off one two three also just only " +
  "while when where which who whom what how why if then there here so such some any all each both much many very still yet now today yesterday tomorrow week day year month " +
  "people country government against since during until around across among through within without per via").split(" "));
const contentWords = s => (norm(plain(s)).match(/[a-z][a-z0-9'-]{2,}/g) || []).map(w => w.replace(/'s$/, "")).filter(w => !STOP.has(w) && !/^\d+$/.test(w));
const stem = w => w.replace(/(ings?|ed|es|s|ly)$/, "").slice(0, 8);

function wordsOf(items) { const set = new Set(); for (const it of items) for (const w of contentWords(`${it.title} ${it.summary || ""} ${it.source || ""}`)) set.add(stem(w)); return set; }

/** verifyEdition(ed, snapshot, glossary, opts) → { errors:[], warnings:[], stats:{} }
 *  ed: the edition module's default export · snapshot: {fetchedAt, clusters:[{rank, sources, items:[{title,summary,url,source,published}]}]} or null
 *  glossary: merged term → definition map (ed.glossary already merged in) · opts.isLand(lat,lon) */
export function verifyEdition(ed, snapshot, glossary, opts = {}) {
  const errors = [], warnings = [], stats = {};
  const tag = `No.${ed?.no} ${ed?.date}`;
  const err = (m, st = tag) => errors.push(`${st}: ${m}`), warn = (m, st = tag) => warnings.push(`${st}: ${m}`);
  const nearLand = opts.isLand ? (lat, lon, r = 2) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (opts.isLand(lat + dy, lon + dx)) return true; return false; } : () => true;

  if (!ed || typeof ed !== "object") { err("edition is not an object"); return { errors, warnings, stats }; }
  if (!ed.no || !/^\d{4}-\d\d-\d\d$/.test(ed.date || "")) err("missing no/date");
  if (!Array.isArray(ed.stories) || ed.stories.length < 4) err("needs at least 4 stories");
  if (!ed.stories?.some(s => s.lite)) warn("no lighter story");
  if (!ed.line) warn("missing edition line");

  // ---- the day's evidence ----
  const items = snapshot ? snapshot.clusters.flatMap(c => c.items.map(i => ({ ...i, rank: c.rank, outlets: c.sources?.length || 1, tier: c.tier }))) : null;
  const byUrl = new Map(); if (items) for (const i of items) { byUrl.set(i.url, i); byUrl.set(i.url.replace(/[?#].*$/, ""), i); }
  const corpus = items ? norm(items.map(i => `${i.title} \n ${i.summary || ""} \n ${i.source}`).join(" \n ")) : null;
  const corpusWords = items ? wordsOf(items) : null;
  if (!snapshot) warn("no .sources.json snapshot, skipping every evidence check");
  const inCorpus = (n) => new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}([^\\d]|$)`).test(corpus);
  const editionMs = Date.parse(`${ed.date}T23:59:59Z`);
  const topTier = snapshot ? snapshot.clusters.filter(c => (c.tier ? c.tier === "major" : (c.sources?.length || 0) >= 6)).map(c => c.rank) : [];

  const ids = new Set(); let prevRank = null; const ranks = [];
  for (const s of ed.stories || []) {
    const st = `${tag} ${s.id}`;
    for (const k of ["id", "place", "city", "cat", "short", "hed", "body", "why", "ctx"]) if (!s[k]) err(`missing ${k}`, st);
    if (ids.has(s.id)) err("duplicate id", st); ids.add(s.id);
    if (!CATS.includes(s.cat)) err(`unknown category ${s.cat}`, st);
    if (!(Math.abs(s.lat) <= 90 && Math.abs(s.lon) <= 180)) err("bad coordinates", st);
    else if (!nearLand(s.lat, s.lon)) err(`coordinates ${s.lat},${s.lon} are not near land; check geocoding`, st);
    if (s.short?.length > 48) warn(`short is ${s.short.length} chars (cover fits ~48)`, st);
    if (s.hed?.length > 80) warn(`hed is ${s.hed.length} chars`, st);
    const words = s.body?.split(/\s+/).length || 0; if (words > 85) warn(`body is ${words} words; keep it under ~80`, st);
    if (!s.sources?.length) err("no sources", st);
    for (const [name, url] of s.sources || []) if (!/^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(url)) err(`bad source url for ${name}`, st);
    for (const m of `${s.body} ${s.why} ${s.ctx}`.matchAll(/\{([^}|]+)(?:\|([^}]+))?\}/g)) { const key = m[2] || m[1]; if (!glossary[key]) err(`glossary term "${key}" has no definition`, st); }
    if (s.people) for (const p of s.people) if (!Array.isArray(p) || p.length !== 2) err("people entries must be [name, role]", st);
    if (s.fig) { if (!s.fig.n || !s.fig.u) err("fig needs n and u", st); if (s.fig.type === "seats" && !(s.fig.mark <= s.fig.total)) err("seats mark > total", st); if (s.fig.type === "grid" && !(s.fig.pct >= 0 && s.fig.pct <= 100)) err("grid pct out of range", st); }

    if (!items) continue;
    const verified = (s.verified || []).map(v => norm(v)); // numbers, or names an editor checked by hand
    // 1. sources are real items from the snapshot, from the outlet named, and recent
    const cited = [];
    for (const [name, url] of s.sources || []) {
      const it = byUrl.get(url) || byUrl.get(String(url).replace(/[?#].*$/, ""));
      if (!it) { err(`source url is not in today's snapshot: ${url}`, st); continue; }
      cited.push(it);
      const a = norm(name).replace(/[^a-z0-9]/g, ""), b = norm(it.source).replace(/[^a-z0-9]/g, "");
      if (!(a.includes(b) || b.includes(a))) err(`source "${name}" is actually ${it.source}: ${url}`, st);
      if (it.published) { const age = (editionMs - Date.parse(it.published)) / 36e5; if (age > 72) err(`cited item is ${Math.round(age)}h older than the edition: ${url}`, st); if (age < -24) err(`cited item is dated after the edition: ${url}`, st); }
      else warn(`cited item has no publish date: ${url}`, st);
    }
    if (cited.length) { ranks.push(Math.min(...cited.map(i => i.rank))); }
    // 2. numbers stated as fact (lighter stories are held to the same standard for names and sources, but their numbers are often colour)
    if (!s.lite) for (const n of new Set([...numbersIn(s.hed), ...numbersIn(s.body), ...numbersIn(s.fig?.n || ""), ...numbersIn(s.fig?.u || "")]))
      if (!verified.includes(n) && !inCorpus(n)) err(`number "${n}" isn't in any source snippet; verify or remove`, st);
    for (const n of new Set([...numbersIn(s.why), ...numbersIn(s.ctx)])) if (!verified.includes(n) && !inCorpus(n)) warn(`background number "${n}" (why/ctx) isn't in the snippets; add it to verified if you checked it`, st);
    // 3. names: every proper noun and acronym in hed/body must appear in the day's snippets
    for (const pn of properNouns(`${s.hed}. ${s.body}`)) if (!verified.includes(pn) && !nameInCorpus(pn, corpus)) err(`name "${pn}" isn't in any source snippet; it may be invented or misspelt`, st);
    // who's who: the surname must be in the snippets (error); a first name the snippets don't use is background (warning)
    for (const [name] of s.people || []) {
      const parts = norm(name).split(/\s+/).filter(p => p.length > 1), last = parts[parts.length - 1];
      if (!last || !corpus.includes(last)) err(`person "${name}" isn't in any source snippet`, st);
      else if (!parts.every(p => corpus.includes(p))) warn(`person "${name}": only "${last}" appears in the snippets; the rest is background`, st);
    }
    if (!corpus.includes(norm(s.place)) && !corpus.includes(norm(s.city))) warn(`neither "${s.place}" nor "${s.city}" appears in the snippets; check the dateline`, st);
    // 4. quotes must be verbatim
    for (const q of quotesIn(`${s.hed} ${s.body}`)) if (!corpus.includes(q)) err(`quote "${q}" isn't verbatim in any source snippet`, st);
    // 5. grounding: the words of hed+body should come from the story's own sources (then the whole day)
    const own = wordsOf(cited), cw = [...new Set(contentWords(`${s.hed} ${s.body}`).map(stem))];
    if (cw.length) {
      const inOwn = cw.filter(w => own.has(w)).length / cw.length, inAll = cw.filter(w => corpusWords.has(w)).length / cw.length;
      stats[s.id] = { grounding: +inOwn.toFixed(2), groundingAll: +inAll.toFixed(2) };
      if (inAll < 0.5) err(`only ${Math.round(inAll * 100)}% of the words in hed+body appear in today's snippets; the text isn't grounded in the sources`, st);
      else if (inOwn < 0.45) warn(`only ${Math.round(inOwn * 100)}% of hed+body comes from this story's cited sources (${Math.round(inAll * 100)}% from the day's); cite the items you used`, st);
    }
  }
  // 6. ranking: the lead must be a top-tier story when one exists; order should broadly follow the clusters
  if (items && ranks.length) {
    const lead = (ed.stories || []).find(s => !s.lite);
    if (lead && topTier.length && ranks[0] !== undefined && !topTier.includes(ranks[0]) && ranks[0] > 3) err(`the lead story (${lead.place}) comes from cluster #${ranks[0]}, but top-tier clusters ${topTier.slice(0, 5).map(r => "#" + r).join(", ")} exist; lead with the biggest story`);
    for (let i = 1; i < ranks.length; i++) if (ranks[i] + 12 < Math.max(...ranks.slice(0, i))) warn(`story ${i + 1} (${ed.stories[i].place}) is cluster #${ranks[i]} but sits below a #${Math.max(...ranks.slice(0, i))} story; order by magnitude`);
    stats.ranks = ranks;
  }
  // 7. quiz
  if (ed.quiz?.length !== 3) err("quiz needs 3 questions");
  const editionText = norm((ed.stories || []).map(s => `${s.hed} ${s.body} ${s.why} ${s.ctx} ${s.fig?.n || ""} ${s.fig?.u || ""}`).join(" "));
  for (const q of ed.quiz || []) {
    if (!(q.a?.length >= 2 && q.c >= 0 && q.c < q.a.length && q.x && q.q)) { err(`bad quiz item: ${q.q}`); continue; }
    const ans = contentWords(q.a[q.c]).map(stem); if (ans.length && !ans.some(w => editionText.includes(w.slice(0, 5)))) warn(`quiz answer "${q.a[q.c]}" doesn't appear in the edition's stories`);
  }
  return { errors, warnings, stats };
}
