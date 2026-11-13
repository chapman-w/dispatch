// Dispatch Dot: the app's own display typeface.
// A 5x7 dot grid (news-wire / departure-board DNA) drawn with didone-style contrast:
// dots in vertical strokes are heavy, dots in horizontal strokes are light, lone dots sit in between.
// usage: node build-font.mjs  -> DispatchDot.otf + DispatchDot.b64 (needs opentype.js)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const P = 112;               // grid pitch in font units
const UPM = 1000;
const R = { stem: 0.48, hair: 0.36, lone: 0.43 }; // dot radius as a fraction of the pitch

// rows top→bottom. Rows "^1"/"^2" sit above the cap height (accents); "_1" sits below the baseline.
const G = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["###..", "#..#.", "#...#", "#...#", "#...#", "#..#.", "###.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".###.", "#...#", "#....", ".###.", "....#", "#...#", ".###."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "#.#..", "..#..", "..#..", "..#..", "#####"],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": ["..", "..", "..", "..", "..", "..", "#."],
  ",": ["..", "..", "..", "..", "..", "#.", "#.", "_1:#."],
  ":": ["..", "..", "#.", "..", "..", "#.", ".."],
  ";": ["..", "..", "#.", "..", "..", "#.", "#."],
  "'": ["#.", "#.", "..", "..", "..", "..", ".."],
  "’": ["#.", "#.", "..", "..", "..", "..", ".."],
  "‘": ["#.", "#.", "..", "..", "..", "..", ".."],
  '"': ["#.#", "#.#", "...", "...", "...", "...", "..."],
  "!": ["#.", "#.", "#.", "#.", "#.", "..", "#."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": ["....", "....", "....", "###.", "....", "....", "...."],
  "–": [".....", ".....", ".....", "####.", ".....", ".....", "....."],
  "—": [".......", ".......", ".......", "######.", ".......", ".......", "......."],
  "−": ["....", "....", "....", "###.", "....", "....", "...."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "$": ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "€": ["..###", ".#...", "####.", ".#...", "####.", ".#...", "..###"],
  "£": ["..##.", ".#..#", ".#...", "###..", ".#...", ".#...", "#####"],
  "(": [".#", "#.", "#.", "#.", "#.", "#.", ".#"],
  ")": ["#.", ".#", ".#", ".#", ".#", ".#", "#."],
  "×": [".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "....."],
  "°": [".#.", "#.#", ".#.", "...", "...", "...", "..."],
  "·": ["..", "..", "..", "#.", "..", "..", ".."],
};
// accented capitals: base glyph + marks above (rows ^2, ^1) or a hook below (_1)
const ACC = {
  acute: ["...#.", "..#.."], grave: [".#...", "..#.."], circ: ["..#..", ".#.#."], uml: [".....", ".#.#."],
  tilde: [".##.#", "#..#."], ring: ["..#..", ".#.#."], caron: [".#.#.", "..#.."],
};
const comp = {
  "Á": ["A", "acute"], "À": ["A", "grave"], "Â": ["A", "circ"], "Ä": ["A", "uml"], "Ã": ["A", "tilde"], "Å": ["A", "ring"],
  "É": ["E", "acute"], "È": ["E", "grave"], "Ê": ["E", "circ"], "Ë": ["E", "uml"],
  "Í": ["I", "acute"], "Ì": ["I", "grave"], "Î": ["I", "circ"], "Ï": ["I", "uml"],
  "Ó": ["O", "acute"], "Ò": ["O", "grave"], "Ô": ["O", "circ"], "Ö": ["O", "uml"], "Õ": ["O", "tilde"],
  "Ú": ["U", "acute"], "Ù": ["U", "grave"], "Û": ["U", "circ"], "Ü": ["U", "uml"],
  "Ñ": ["N", "tilde"], "Ý": ["Y", "acute"], "Š": ["S", "caron"], "Č": ["C", "caron"], "Ž": ["Z", "caron"], "Ř": ["R", "caron"], "Ś": ["S", "acute"], "Ź": ["Z", "acute"], "Ń": ["N", "acute"], "Ć": ["C", "acute"],
};
for (const [ch, [base, mark]] of Object.entries(comp)) G[ch] = [`^2:${ACC[mark][0]}`, `^1:${ACC[mark][1]}`, ...G[base]];
G["Ç"] = [...G.C, "_1:..#.."];
G["Ł"] = ["#....", "#....", "#.#..", "##...", "#....", "#....", "#####"];
G["Ø"] = [".###.", "#..##", "#..##", "#.#.#", "##..#", "##..#", ".###."];
G["Æ"] = [".####", "#.#..", "#.#..", "#####", "#.#..", "#.#..", "#.###"];
G["ß"] = G.B;

// parse to a set of (col,row) with row 0 = top cap row ... 6 = baseline row; ^n = -n; _1 = 7
function cells(rows) {
  const out = [];
  let r = 0;
  for (const raw of rows) {
    let row = r, s = raw;
    const m = raw.match(/^([\^_])(\d):(.*)$/);
    if (m) { row = m[1] === "^" ? -Number(m[2]) : 6 + Number(m[2]); s = m[3]; } else r++;
    [...s].forEach((c, x) => { if (c === "#") out.push([x, row]); });
  }
  return out;
}

function circle(p, cx, cy, r) {
  const k = 0.5523 * r; // cubic bézier circle
  p.moveTo(cx + r, cy);
  p.curveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
  p.curveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
  p.curveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
  p.curveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
  p.close();
}

function glyphFor(ch, rows) {
  const cs = cells(rows), on = new Set(cs.map(([x, y]) => `${x},${y}`));
  const cols = Math.max(...rows.map(r => r.replace(/^[\^_]\d:/, "").length));
  const p = new opentype.Path();
  for (const [x, y] of cs) {
    const v = on.has(`${x},${y - 1}`) || on.has(`${x},${y + 1}`);
    const h = on.has(`${x - 1},${y}`) || on.has(`${x + 1},${y}`);
    const diag = on.has(`${x - 1},${y - 1}`) || on.has(`${x + 1},${y + 1}`) || on.has(`${x + 1},${y - 1}`) || on.has(`${x - 1},${y + 1}`);
    const r = (v ? R.stem : h ? R.hair : diag ? (R.stem + R.hair) / 2 : R.lone) * P;
    circle(p, x * P + P / 2, (6 - y) * P + P / 2, r);
  }
  const unicode = ch.codePointAt(0);
  const isLetter = /[A-Z0-9ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŠČŽŘŚŹŃĆŁß]/.test(ch);
  const adv = (isLetter ? 5 : cols) * P + P * (isLetter ? 1 : 0.9);
  return new opentype.Glyph({ name: "u" + unicode.toString(16).toUpperCase().padStart(4, "0"), unicode, advanceWidth: Math.round(adv), path: p });
}

const glyphs = [new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 6 * P, path: new opentype.Path() }),
  new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 3 * P, path: new opentype.Path() }),
  new opentype.Glyph({ name: "nbsp", unicode: 160, advanceWidth: 3 * P, path: new opentype.Path() })];
for (const [ch, rows] of Object.entries(G)) {
  glyphs.push(glyphFor(ch, rows));
  // lowercase maps to the same capitals so text renders even without text-transform
  const lo = ch.toLowerCase();
  if (lo !== ch && lo.length === 1 && !G[lo]) { const g = glyphFor(lo, rows); glyphs.push(g); }
}

const font = new opentype.Font({ familyName: "Dispatch Dot", styleName: "Regular", unitsPerEm: UPM, ascender: 9 * P, descender: -2 * P, glyphs,
  designer: "Dispatch", description: "Display face for the Dispatch app: a 5x7 news-wire dot grid with didone contrast.", copyright: "Dispatch 2026" });
const buf = Buffer.from(font.toArrayBuffer());
fs.writeFileSync(path.join(here, "DispatchDot.otf"), buf);
fs.writeFileSync(path.join(here, "DispatchDot.b64"), buf.toString("base64"));
console.log(`Dispatch Dot: ${glyphs.length} glyphs, ${(buf.length / 1024).toFixed(1)} KB`);
