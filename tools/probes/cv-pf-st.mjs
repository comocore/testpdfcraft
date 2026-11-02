// CV, PF and ST probes: source images and text for Create PDF, a report to export, large files, and broken files.

import { crc32, deflateSync } from 'node:zlib';
import { BASE14, Doc, image, outline, resources, str, textLines, wrap } from '../lib/pdf.mjs';
import { enParagraph, enTitle, rng, zhParagraphs } from '../lib/text.mjs';
import { header } from './rd.mjs';

const fontsOnly = resources({ fonts: BASE14 });

/** A test picture: gradients, a grid and a few coloured blocks, so scaling and colour are easy to judge. */
function picture(w, h, seed) {
  const rand = rng(seed);
  const px = Buffer.alloc(w * h * 3);
  const blocks = Array.from({ length: 6 }, () => [rand() * w, rand() * h, 20 + rand() * w * 0.2, [rand() * 255, rand() * 255, rand() * 255]]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let c = [(x * 255) / w, (y * 255) / h, 160];
      if (x % 50 === 0 || y % 50 === 0) c = [40, 40, 40];
      for (const [bx, by, bs, col] of blocks) if (x > bx && x < bx + bs && y > by && y < by + bs) c = col;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  return px;
}

function png(w, h, rgb) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  // pHYs: 150 pixels per inch, so the page size of Create PDF can be checked.
  const phys = Buffer.alloc(9);
  phys.writeUInt32BE(5906, 0);
  phys.writeUInt32BE(5906, 4);
  phys[8] = 1;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('pHYs', phys), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function bmp(w, h, rgb) {
  const row = Math.ceil((w * 3) / 4) * 4;
  const buf = Buffer.alloc(54 + row * h);
  buf.write('BM', 0, 'latin1');
  buf.writeUInt32LE(buf.length, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(row * h, 34);
  buf.writeInt32LE(3780, 38);
  buf.writeInt32LE(3780, 42);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = ((h - 1 - y) * w + x) * 3;
      const o = 54 + y * row + x * 3;
      buf[o] = rgb[s + 2];
      buf[o + 1] = rgb[s + 1];
      buf[o + 2] = rgb[s];
    }
  return buf;
}

/** An uncompressed, little-endian, multi-page RGB TIFF. */
function tiff(pages) {
  const parts = [];
  let offset = 8;
  const header = Buffer.alloc(8);
  header.write('II', 0, 'latin1');
  header.writeUInt16LE(42, 2);
  header.writeUInt32LE(8, 4);
  parts.push(header);
  pages.forEach(({ w, h, rgb }, p) => {
    const entries = 11;
    const ifdSize = 2 + entries * 12 + 4;
    const bpsAt = offset + ifdSize;
    const resAt = bpsAt + 6;
    const dataAt = resAt + 16;
    const next = p < pages.length - 1 ? dataAt + rgb.length : 0;
    const ifd = Buffer.alloc(ifdSize + 6 + 16);
    ifd.writeUInt16LE(entries, 0);
    const tags = [
      [256, 4, 1, w],
      [257, 4, 1, h],
      [258, 3, 3, bpsAt],
      [259, 3, 1, 1],
      [262, 3, 1, 2],
      [273, 4, 1, dataAt],
      [277, 3, 1, 3],
      [278, 4, 1, h],
      [279, 4, 1, rgb.length],
      [282, 5, 1, resAt],
      [283, 5, 1, resAt + 8],
    ];
    tags.forEach(([tag, type, count, value], i) => {
      const o = 2 + i * 12;
      ifd.writeUInt16LE(tag, o);
      ifd.writeUInt16LE(type, o + 2);
      ifd.writeUInt32LE(count, o + 4);
      if (type === 3 && count === 1) ifd.writeUInt16LE(value, o + 8);
      else ifd.writeUInt32LE(value, o + 8);
    });
    ifd.writeUInt32LE(next, 2 + entries * 12);
    [8, 8, 8].forEach((v, i) => ifd.writeUInt16LE(v, ifdSize + i * 2));
    [150, 1, 150, 1].forEach((v, i) => ifd.writeUInt32LE(v, ifdSize + 6 + i * 4));
    parts.push(ifd, rgb);
    offset = dataAt + rgb.length;
  });
  return Buffer.concat(parts);
}

export function build(out, { large }) {
  // CV-IMG: source images for Create PDF. JPEG and GIF are made from the PNG in the prep batch (README §3.4).
  {
    const w = 900;
    const h = 600;
    const rgb = picture(w, h, 501);
    out('CV-IMG-01.png', png(w, h, rgb), { case: 'CV-IMG-01', purpose: '900x600 RGB PNG at 150 ppi (6 x 4 inches)' });
    out('CV-IMG-02.bmp', bmp(w, h, rgb), { case: 'CV-IMG-01', purpose: 'The same picture as a 24-bit BMP at 96 ppi' });
    const pages = [601, 602, 603].map((seed) => ({ w: 600, h: 800, rgb: picture(600, 800, seed) }));
    out('CV-IMG-03.tif', tiff(pages), { case: 'CV-IMG-01', purpose: 'Three-page uncompressed TIFF at 150 ppi (4 x 5.33 inches each)' });
  }

  // CV-TXT-01: a plain text file with English and Chinese, for Create PDF.
  {
    const rand = rng(502);
    const text = ['CV-TXT-01: plain text with English and Chinese (UTF-8).', '', ...wrap(enParagraph(rand, 6), 70), '', ...zhParagraphs(rand, 3), '', 'End of file.', ''].join('\n');
    out('CV-TXT-01.txt', Buffer.from(text, 'utf8'), { case: 'CV-TXT-01', purpose: 'UTF-8 text with English and Chinese paragraphs' });
  }

  // CV-REPORT: a report-like PDF to export to Word, PowerPoint, HTML, RTF, Markdown and text.
  {
    const rand = rng(503);
    const d = new Doc();
    const pages = d.reservePages(3);
    const im = image(d.pdf, { width: 300, height: 200, data: picture(300, 200, 504) });
    const res = resources({ fonts: BASE14, xobjects: { Im: im } });
    const table = (x, y) => {
      const rows = [['Item', 'Quantity', 'Price'], ['Paper', '12', '$4.50'], ['Ink', '3', '$19.00'], ['Folders', '40', '$12.80']];
      const out = [];
      rows.forEach((r, i) => r.forEach((c, j) => out.push(textLines(i ? 'Helv' : 'HelvB', 11, x + 8 + j * 130, y - 16 - i * 22, [c]))));
      for (let i = 0; i <= rows.length; i++) out.push(`q 0.6 w ${x} ${y - i * 22} m ${x + 390} ${y - i * 22} l S Q`);
      for (let j = 0; j <= 3; j++) out.push(`q 0.6 w ${x + j * 130} ${y} m ${x + j * 130} ${y - rows.length * 22} l S Q`);
      return out.join('\n');
    };
    d.page({
      content: [
        header('CV-REPORT', 'A report to export', 'export keeps the two headings, the bold and italic words, the bulleted list, the 4 x 3 table and the picture; reading order is heading, paragraph, list, table.'),
        textLines('HelvB', 22, 50, 690, ['1. ' + enTitle(rand)]),
        textLines('Times', 12, 50, 660, wrap(enParagraph(rand, 4), 90)),
        textLines('TimesI', 12, 50, 590, ['This sentence is in italics, and the next words are']),
        textLines('HelvB', 12, 330, 590, ['in bold.']),
        textLines('Times', 12, 60, 560, ['\x95 First point of a bulleted list', '\x95 Second point', '\x95 Third point']),
        table(50, 490),
        textLines('HelvB', 18, 50, 360, ['2. A picture with a caption']),
        'q 300 0 0 200 50 120 cm /Im Do Q',
        textLines('TimesI', 10, 50, 105, ['Figure 1: a test picture.']),
      ].join('\n'),
      resources: res,
    });
    for (let i = 1; i < 3; i++) d.page({ content: [textLines('HelvB', 18, 50, 720, [`${i + 2}. ${enTitle(rand)}`]), textLines('Times', 12, 50, 690, wrap(enParagraph(rand, 14), 90))].join('\n'), resources: res });
    const marks = outline(d.pdf, [{ title: '1. Report', page: pages[0] }, { title: '3. Section', page: pages[1] }, { title: '4. Section', page: pages[2] }]);
    out('CV-REPORT.pdf', d.finish({ catalog: ` /Outlines ${marks} 0 R` }), { case: 'CV-DOCX-01 CV-PPTX-01 CV-EXP-01', purpose: 'Headings, styles, list, table and a picture to export' });
  }

  // PF-TEXT-1000: a thousand pages of text.
  {
    const rand = rng(701);
    const d = new Doc();
    const pages = d.reservePages(1000);
    for (let i = 0; i < 1000; i++)
      d.page({ content: [textLines('HelvB', 14, 50, 740, [`Page ${i + 1} of 1000`]), textLines('Times', 10, 50, 715, wrap(enParagraph(rand, 18), 105), 12)].join('\n'), resources: fontsOnly, deflate: true });
    const marks = outline(d.pdf, Array.from({ length: 50 }, (_, c) => ({ title: `Chapter ${c + 1}`, page: pages[c * 20] })));
    out('PF-TEXT-1000.pdf', d.finish({ catalog: ` /Outlines ${marks} 0 R` }), { case: 'PF-OPEN-01 PF-CLI-01 MC-CLI-01', purpose: '1000 pages of text with 50 bookmarks' });
  }

  // PF-IMG-60: sixty pages, each a large picture (skipped with --skip-large).
  if (large) {
    const d = new Doc();
    for (let i = 0; i < 60; i++) {
      const im = image(d.pdf, { width: 1700, height: 2200, data: picture(1700, 2200, 800 + i) });
      d.page({ content: `q 612 0 0 792 0 0 cm /Im Do Q\n${textLines('HelvB', 30, 40, 40, [`Image page ${i + 1} of 60`])}`, resources: resources({ fonts: BASE14, xobjects: { Im: im } }) });
    }
    out('PF-IMG-60.pdf', d.finish(), { case: 'PF-OPEN-02 PF-MEM-02 CV-OPT-01', purpose: '60 pages, each a 1700x2200 picture (200 ppi), Flate' });
  }

  // PF-CMB-01…20: twenty small files to combine.
  for (let n = 1; n <= 20; n++) {
    const rand = rng(900 + n);
    const d = new Doc();
    for (let p = 0; p < 5; p++) d.page({ content: [textLines('HelvB', 40, 50, 600, [`CMB-${String(n).padStart(2, '0')} p${p + 1}`]), textLines('Times', 11, 50, 540, wrap(enParagraph(rand, 6), 95))].join('\n'), resources: fontsOnly });
    out(`PF-CMB-${String(n).padStart(2, '0')}.pdf`, d.finish(), { case: 'PF-CMB-01', purpose: 'One of 20 five-page files to combine' });
  }

  // ST probes: broken files. Start from a good one and break it in known ways.
  const good = (() => {
    const rand = rng(1001);
    const d = new Doc();
    for (let p = 0; p < 5; p++) d.page({ content: [textLines('HelvB', 24, 50, 720, [`Page ${p + 1} of 5`]), textLines('Times', 12, 50, 680, wrap(enParagraph(rand, 10), 90))].join('\n'), resources: fontsOnly });
    return d.finish();
  })();
  out('ST-BAD-01-truncated.pdf', good.subarray(0, Math.floor(good.length * 0.6)), { case: 'ST-BAD-01', purpose: 'The first 60% of a 5-page file: no xref, no trailer' });
  {
    const text = good.toString('latin1');
    const xrefAt = text.lastIndexOf('\nxref\n') + 1;
    // Every offset in the table is 7 bytes too high; the file itself is intact.
    const broken = text.slice(0, xrefAt) + text.slice(xrefAt).replace(/^(\d{10}) 00000 n /gm, (m, o) => `${String(Number(o) + 7).padStart(10, '0')} 00000 n `);
    out('ST-BAD-02-xref.pdf', Buffer.from(broken, 'latin1'), { case: 'ST-BAD-02', purpose: 'Wrong xref offsets; a reader should rebuild the table and show 5 pages' });
  }
  {
    // A page tree whose Kids include its own parent.
    const d = new Doc();
    d.page({ content: textLines('Helv', 14, 50, 700, ['ST-BAD-03: the page tree loops back on itself.']), resources: fontsOnly });
    const bytes = d.finish().toString('latin1').replace(/\/Kids \[(\d+) 0 R\] \/Count 1/, (m, k) => `/Kids [${k} 0 R 2 0 R] /Count 2`);
    out('ST-BAD-03-cycle.pdf', fixXref(bytes), { case: 'ST-BAD-03', purpose: 'Page tree cycle: /Kids lists the Pages node itself' });
  }
  {
    const depth = 20000;
    const d = new Doc();
    d.page({ content: textLines('Helv', 14, 50, 700, ['ST-BAD-04: an array nested 20,000 deep follows in the catalog.']), resources: fontsOnly });
    out('ST-BAD-04-deep.pdf', d.finish({ catalog: ` /Probe ${'['.repeat(depth)}0${']'.repeat(depth)}` }), { case: 'ST-BAD-04', purpose: 'An array nested 20,000 deep' });
  }
  {
    // 256 MiB of zeros in a Flate stream of about 250 KB: a decompression bomb as a page's content.
    const zeros = Buffer.alloc(256 * 1024 * 1024, 0x20);
    const bomb = deflateSync(zeros, { level: 9 });
    const d = new Doc();
    d.page({ content: textLines('Helv', 14, 50, 700, ['ST-BAD-05: the second content stream inflates to 256 MiB of spaces.']), resources: fontsOnly });
    const s = d.pdf.add({ dict: '/Filter /FlateDecode', data: bomb });
    d.pdf.set(d.pageNums[0], d.pdf.objects[d.pageNums[0]].replace(/\/Contents (\d+) 0 R/, (m, c) => `/Contents [${c} 0 R ${s} 0 R]`));
    out('ST-BAD-05-bomb.pdf', d.finish(), { case: 'ST-BAD-05', purpose: 'Decompression bomb: 256 MiB of spaces in a small Flate stream' });
  }
  out('ST-BAD-06-empty.pdf', Buffer.alloc(0), { case: 'ST-BAD-06', purpose: 'An empty file named .pdf' });
  out('ST-BAD-06-png.pdf', png(40, 30, picture(40, 30, 1002)), { case: 'ST-BAD-06', purpose: 'A PNG picture named .pdf' });
  {
    // The 0.17.0 fix (#5620): a soft mask 60,000 x 1 on an image 1 x 60,000 made PdfCraft ask for 57.6 GB.
    const d = new Doc();
    const mask = image(d.pdf, { width: 60000, height: 1, colorSpace: '/DeviceGray', data: Buffer.alloc(60000, 128) });
    const im = image(d.pdf, { width: 1, height: 60000, colorSpace: '/DeviceGray', data: Buffer.alloc(60000, 60), smask: mask });
    d.page({
      content: [header('ST-MASK-01', 'Soft mask of other proportions', 'export the images or run Reduce file size: PdfCraft 0.17.0 and later finish without running out of memory; 0.16.1 and earlier could abort.'), 'q 20 0 0 600 300 60 cm /Im Do Q'].join('\n'),
      resources: resources({ fonts: BASE14, xobjects: { Im: im } }),
    });
    out('ST-MASK-01.pdf', d.finish(), { case: 'ST-BAD-07', purpose: 'Regression file for the 0.17.0 soft mask fix (PR #5620)' });
  }
}

/** Rewrites the xref offsets after the bytes before them changed length. */
function fixXref(text) {
  const offsets = [];
  const re = /(?:^|\n)(\d+) 0 obj\n/g;
  let m;
  while ((m = re.exec(text))) offsets[Number(m[1])] = m.index + (m[0].startsWith('\n') ? 1 : 0);
  const xrefAt = text.lastIndexOf('\nxref\n') + 1;
  let i = 0;
  const table = text.slice(xrefAt).replace(/^(\d{10}) (\d{5}) ([nf]) $/gm, (line, o, g, t) => {
    const n = i++;
    return t === 'f' ? line : `${String(offsets[n]).padStart(10, '0')} ${g} n `;
  });
  return Buffer.from(text.slice(0, xrefAt) + table.replace(/startxref\n\d+/, `startxref\n${xrefAt}`), 'latin1');
}

export { str };
