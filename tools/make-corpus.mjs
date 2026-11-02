#!/usr/bin/env node
// Writes the generated test files to corpus/generated/, with manifest.json and SHA256SUMS.txt.
//
//   node tools/make-corpus.mjs               everything (about 10 seconds, 20 MB)
//   node tools/make-corpus.mjs --skip-large  without PF-IMG-60.pdf
//
// When qpdf is installed, it also writes the encrypted variants SC-ENC-*.pdf (README §3.4 lists the passwords).
// When pdftoppm (poppler) is installed, it also writes the scanned-page sources CV-SCAN-*.png for OCR.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as buildCvPfSt } from './probes/cv-pf-st.mjs';
import { build as buildOrAnFm } from './probes/or-an-fm.mjs';
import { build as buildRd } from './probes/rd.mjs';
import { build as buildSc } from './probes/sc.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(root, 'corpus', 'generated');
const large = !process.argv.includes('--skip-large');

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const manifest = [];
const pending = [];
const out = (name, data, meta) => {
  if (name.endsWith('.pdf') && meta.case !== 'ST-BAD-01' && !name.startsWith('ST-BAD-02') && !name.startsWith('ST-BAD-06') && data.length) checkXref(name, data);
  manifest.push({ file: name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), ...meta });
  pending.push(writeFile(join(OUT, name), data));
};

buildRd(out);
buildSc(out);
buildOrAnFm(out);
buildCvPfSt(out, { large });
await Promise.all(pending);

// Encrypted variants, made with qpdf so that the encryption comes from an independent implementation.
const ENCRYPTED = [
  ['SC-ENC-RC4-40.pdf', ['--allow-weak-crypto', '--encrypt', 'user40', 'owner40', '40', '--']],
  ['SC-ENC-RC4-128.pdf', ['--allow-weak-crypto', '--encrypt', 'user128', 'owner128', '128', '--use-aes=n', '--']],
  ['SC-ENC-AES-128.pdf', ['--encrypt', 'user128a', 'owner128a', '128', '--use-aes=y', '--']],
  ['SC-ENC-AES-256.pdf', ['--encrypt', 'user256', 'owner256', '256', '--']],
  ['SC-ENC-UNICODE.pdf', ['--encrypt', 'pässwörd中文', 'owner-unicode', '256', '--']],
  ['SC-ENC-OWNER-ONLY.pdf', ['--encrypt', '', 'owner-only', '256', '--print=none', '--extract=n', '--modify=none', '--annotate=n', '--']],
];
const has = (cmd) => {
  try {
    execFileSync(cmd, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
if (has('qpdf')) {
  for (const [name, args] of ENCRYPTED) {
    // Each list ends with the `--` that closes --encrypt; the input and output files follow it.
    execFileSync('qpdf', ['--deterministic-id', ...args, join(OUT, 'SC-ENC-SRC.pdf'), join(OUT, name)]);
    manifest.push({ file: name, case: 'SC-ENC-01', purpose: `qpdf ${args.filter((a) => a !== '--').join(' ')}`, made_by: 'qpdf' });
  }
} else {
  console.warn('qpdf not found: skipped the encrypted variants SC-ENC-*.pdf (install qpdf and run again)');
}

// Scanned-page sources for OCR: the probe pages rendered as 200 ppi greyscale images.
if (has('pdftoppm')) {
  execFileSync('pdftoppm', ['-r', '200', '-gray', '-png', '-f', '1', '-l', '1', join(OUT, 'CV-REPORT.pdf'), join(OUT, 'CV-SCAN-EN')]);
  execFileSync('pdftoppm', ['-r', '200', '-gray', '-png', '-f', '1', '-l', '1', join(OUT, 'RD-TXT-02.pdf'), join(OUT, 'CV-SCAN-ZH')]);
  manifest.push({ file: 'CV-SCAN-EN-1.png', case: 'CV-OCR-01', purpose: 'CV-REPORT page 1 as a 200 ppi grey scan', made_by: 'pdftoppm' });
  manifest.push({ file: 'CV-SCAN-ZH-1.png', case: 'CV-OCR-03', purpose: 'RD-TXT-02 page 1 as a 200 ppi grey scan', made_by: 'pdftoppm' });
} else {
  console.warn('pdftoppm not found: skipped CV-SCAN-*.png (install poppler and run again)');
}

manifest.sort((a, b) => a.file.localeCompare(b.file));
await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify({ generator: 'tools/make-corpus.mjs', node: process.version, files: manifest }, null, 1)}\n`);
await writeFile(join(OUT, 'SHA256SUMS.txt'), manifest.filter((m) => m.sha256).map((m) => `${m.sha256}  ${m.file}`).join('\n') + '\n');
const total = manifest.reduce((s, m) => s + (m.bytes ?? 0), 0);
console.log(`${manifest.length} files, ${(total / 1048576).toFixed(1)} MB → ${OUT}`);

/** Every xref entry must point at "<n> 0 obj"; catches mistakes in the probe code, not in the broken probes. */
function checkXref(name, data) {
  const text = data.toString('latin1');
  const start = Number(/startxref\n(\d+)/.exec(text.slice(-64))?.[1]);
  if (text.slice(start, start + 5) !== 'xref\n') throw new Error(`${name}: startxref doesn't point at the table`);
  const lines = text.slice(start).split('\n');
  const [, count] = lines[1].split(' ').map(Number);
  for (let n = 1; n < count; n++) {
    const [off, , kind] = lines[2 + n].split(' ');
    if (kind !== 'n') continue;
    if (!text.startsWith(`${n} 0 obj`, Number(off))) throw new Error(`${name}: object ${n} isn't at offset ${Number(off)}`);
  }
}
