/* eslint-disable @typescript-eslint/no-require-imports */
/* This is a Node script — not part of the frontend bundle. */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const IGNORES = ['node_modules', '.next', '.git', 'out', 'public'];
const CODE_EXTS = ['.ts', '.tsx', '.js', '.jsx'];

if (!fs.existsSync(PAGES_DIR)) {
  console.error('src/pages not found. Execute a partir da raiz do projeto.');
  process.exit(1);
}

// map lowercase basename -> actual basename (without ext)
const pageFiles = fs.readdirSync(PAGES_DIR).filter((f) => /\.(tsx?|jsx?)$/.test(f));
const pageMap = new Map();
for (const f of pageFiles) {
  const name = path.basename(f, path.extname(f));
  pageMap.set(name.toLowerCase(), name);
}

function walk(dir, cb) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

const filesToEdit = [];
walk(path.join(ROOT, 'src'), (file) => {
  const ext = path.extname(file).toLowerCase();
  if (!CODE_EXTS.includes(ext)) return;
  filesToEdit.push(file);
});

let updated = 0;
for (const file of filesToEdit) {
  let txt = fs.readFileSync(file, 'utf8');
  const orig = txt;

  // regex matches import/require strings that include pages/<segment>
  const re = /(['"`])((?:\.\.\/|\.\/)+(?:(?:[A-ZaZ0-9_-]+\/)*)pages\/)([A-Za-z0-9_-]+)(['"`])/g;

  txt = txt.replace(re, (m0, q1, prefix, pageSegment, q2) => {
    const actual = pageMap.get(pageSegment.toLowerCase());
    if (!actual) return m0; // no mapping -> skip
    if (actual === pageSegment) return m0; // already correct
    return q1 + prefix + actual + q2;
  });

  if (txt !== orig) {
    fs.writeFileSync(file, txt, 'utf8');
    console.log('Updated imports in:', path.relative(ROOT, file));
    updated++;
  }
}

console.log(`\nDone. Files updated: ${updated}`);
console.log('-> Revise as mudanças, git add -A && git commit -m "Fix pages import casing" && push');