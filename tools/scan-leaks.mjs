#!/usr/bin/env node
// Searches a PDF that PdfCraft saved for text that should be gone: the GPCSECRET tokens of the probe files,
// or any string you name. It reads every byte of the file, so earlier revisions kept by an incremental save count.
//
//   node tools/scan-leaks.mjs runs/…/outputs/SC-RED-01.pdfcraft.pdf               the secrets listed in manifest.json
//   node tools/scan-leaks.mjs out.pdf --token GPCSECRET-TEXT-0001 --token "151.731 523.117"
//   node tools/scan-leaks.mjs out.pdf --probe SC-RED-01.pdf                       the secrets of another probe
//   node tools/scan-leaks.mjs out.pdf --keep                                      also confirm the GPCKEEP tokens are still there
//
// It looks in the raw bytes, in every stream it can inflate (Flate, including object streams), in hex strings,
// in UTF-16 strings, and in text split across a TJ array. Exit code 1 when a secret is found.
// It can't see text inside images or in encrypted streams: check those another way (README §5.4).

import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, inflateSync } from 'node:zlib';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && !['--token', '--probe'].includes(args[i - 1]));
if (!file) {
  console.error('usage: scan-leaks.mjs <file.pdf> [--token TEXT]… [--probe NAME.pdf] [--keep]');
  process.exit(2);
}
const values = (flag) => args.flatMap((a, i) => (args[i - 1] === flag ? [a] : []));
let secrets = values('--token');
let keep = [];
if (!secrets.length || args.includes('--keep')) {
  const manifest = JSON.parse(await readFile(join(root, 'corpus', 'generated', 'manifest.json'), 'utf8'));
  const probe = values('--probe')[0] ?? probeName(basename(file));
  const entry = manifest.files.find((f) => f.file === probe);
  if (!entry) {
    console.error(`no probe named ${probe} in corpus/generated/manifest.json; name it with --probe, or give --token`);
    process.exit(2);
  }
  if (!secrets.length) secrets = (entry.secrets ?? []).map((s) => s.replace(/ \(.*\)$/, ''));
  keep = entry.keep ?? [];
}

const bytes = await readFile(file);
const raw = bytes.toString('latin1');

// Inflate every stream we can. Encrypted streams and other filters simply fail to inflate and are skipped.
const streams = [];
const re = /(?<!end)stream\r?\n/g;
let m;
while ((m = re.exec(raw))) {
  const start = m.index + m[0].length;
  const end = raw.indexOf('endstream', start);
  if (end < 0) break;
  const before = raw.slice(Math.max(0, m.index - 4000), m.index);
  const obj = [...before.matchAll(/(\d+) \d+ obj\b/g)].at(-1)?.[1] ?? '?';
  // The end-of-line before "endstream" isn't part of the data.
  let stop = end;
  if (raw[stop - 1] === '\n') stop--;
  if (raw[stop - 1] === '\r') stop--;
  try {
    streams.push({ obj, text: inflateSync(bytes.subarray(start, stop), { finishFlush: constants.Z_SYNC_FLUSH }).toString('latin1') });
  } catch {
    streams.push({ obj, text: raw.slice(start, stop) });
  }
  re.lastIndex = end;
}

const hex = (s) => Buffer.from(s, 'latin1').toString('hex');
const utf16 = (s) => Buffer.from(s, 'utf16le').swap16().toString('latin1');
const joinTJ = (t) => t.replace(/\)\s*-?\d*\.?\d+\s*\(/g, '');
const decodeHexStrings = (t) => t.replace(/<([0-9A-Fa-f\s]{4,})>/g, (_, h) => Buffer.from(h.replace(/\s/g, ''), 'hex').toString('latin1'));

function find(token) {
  const where = [];
  const forms = [token, utf16(token)];
  const look = (label, text) => {
    for (const f of forms) if (text.includes(f)) return where.push(label);
    const decoded = decodeHexStrings(text);
    for (const f of forms) if (decoded.includes(f)) return where.push(`${label} (hex string)`);
    if (joinTJ(text).includes(token)) return where.push(`${label} (split across a TJ array)`);
    if (text.toLowerCase().includes(hex(token))) return where.push(`${label} (hex)`);
  };
  look('raw bytes', raw);
  for (const s of streams) look(`stream in object ${s.obj}`, s.text);
  return [...new Set(where)];
}

let leaked = 0;
console.log(`${basename(file)}: ${bytes.length} bytes, ${streams.length} streams, ${(raw.match(/%%EOF/g) ?? []).length} revision(s)`);
for (const t of secrets) {
  const at = find(t);
  if (at.length) leaked++;
  console.log(`${at.length ? 'LEAK ' : 'gone '} ${t}${at.length ? `  ← ${at.slice(0, 4).join('; ')}` : ''}`);
}
for (const t of keep) {
  const at = find(t);
  console.log(`${at.length ? 'kept ' : 'LOST '} ${t}`);
}
console.log(leaked ? `\n${leaked} of ${secrets.length} secrets are still in the file.` : `\nNone of the ${secrets.length} secrets is in the file.`);
process.exit(leaked ? 1 : 0);

/** outputs are named <case or probe>.pdfcraft.pdf; map back to the probe file. */
function probeName(name) {
  const stem = name.replace(/\.pdfcraft.*$/, '').replace(/\.pdf$/, '');
  return `${stem}.pdf`;
}
