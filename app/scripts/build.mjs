// Builds the app page from the web app: ../index.html → www/index.html (+ www/editions.json, www/fonts/).
// - adds the doctype, viewport (notch-aware, no zoom) and charset
// - swaps the Google Fonts link for the bundled fonts in src/fonts, so the app works offline and makes
//   no third-party requests (simpler App Store privacy answers)
// - points the app at the hosted editions.json so it picks up each day's edition
// usage: node scripts/build.mjs [--site]   (--site builds the web version into ../site/ for GitHub Pages instead)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = dirname(dirname(fileURLToPath(import.meta.url)));
const root = dirname(app);
const site = process.argv.includes('--site');
const outDir = site ? join(root, 'site') : join(app, 'www');
const DATA_URL = 'https://chapman-w.github.io/dispatch/editions.json';

let html = readFileSync(join(root, 'index.html'), 'utf8');
const fontsCss = readFileSync(join(app, 'src/fonts/fonts.css'), 'utf8');

html = html
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .replace(/<meta name="claude:[^>]*>\s*/g, '')
  .replace(/<title>[^<]*<\/title>\s*/, '');

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Dispatch</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0B0B0B">
<link rel="icon" href="icon.png">
<link rel="apple-touch-icon" href="icon.png">
<script>window.DISPATCH_DATA_URL=${JSON.stringify(site ? 'editions.json' : DATA_URL)};window.DISPATCH_NATIVE=${!site};</script>
<style>
${fontsCss}</style>
`;
// index.html starts with <style>…</style>; everything up to the last </style> before <body-ish content goes in <head>
const cut = html.indexOf('</style>') + '</style>'.length;
const out = `${head}${html.slice(0, cut)}\n</head>\n<body>\n${html.slice(cut)}\n</body>\n</html>\n`;

mkdirSync(join(outDir, 'fonts'), { recursive: true });
writeFileSync(join(outDir, 'index.html'), out);
for (const f of readdirSync(join(app, 'src/fonts'))) if (f.endsWith('.woff2')) copyFileSync(join(app, 'src/fonts', f), join(outDir, 'fonts', f));
copyFileSync(join(root, 'editions.json'), join(outDir, 'editions.json'));
copyFileSync(join(app, 'assets/icon-1024.png'), join(outDir, 'icon.png'));
if (site && existsSync(join(app, 'store/privacy.html'))) copyFileSync(join(app, 'store/privacy.html'), join(outDir, 'privacy.html'));
if (site) writeFileSync(join(outDir, '.nojekyll'), '');
console.log(`Built ${site ? 'site' : 'www'}/index.html (${(out.length / 1024).toFixed(0)} KB) + editions.json + fonts`);
