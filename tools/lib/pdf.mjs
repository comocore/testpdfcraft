// A small PDF writer for the probe files: numbered objects, optional Flate streams, a classic xref table.
// The output depends only on the input, so the same script writes the same bytes
// (Flate output can differ between zlib builds; the probes that matter keep their text uncompressed).

import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

export class Pdf {
  constructor({ version = '1.7' } = {}) {
    this.version = version;
    this.objects = [null];
  }

  /** Reserves an object number, to be filled with set(). */
  reserve() {
    this.objects.push(undefined);
    return this.objects.length - 1;
  }

  /** Adds an object: a string of PDF syntax, or { dict, data, deflate } for a stream. Returns its number. */
  add(body) {
    this.objects.push(body);
    return this.objects.length - 1;
  }

  set(n, body) {
    this.objects[n] = body;
    return n;
  }

  /** Writes the file. `info` is an object number or undefined. */
  build({ root, info, extraTrailer = '' }) {
    const chunks = [Buffer.from(`%PDF-${this.version}\n%\xe2\xe3\xcf\xd3\n`, 'latin1')];
    let offset = chunks[0].length;
    const offsets = [0];
    for (let n = 1; n < this.objects.length; n++) {
      const body = this.objects[n];
      if (body === undefined) throw new Error(`object ${n} reserved but never set`);
      offsets.push(offset);
      const piece = Buffer.concat([Buffer.from(`${n} 0 obj\n`, 'latin1'), serialize(body), Buffer.from('\nendobj\n', 'latin1')]);
      chunks.push(piece);
      offset += piece.length;
    }
    const id = createHash('md5').update(Buffer.concat(chunks)).digest('hex');
    const xref = [`xref\n0 ${this.objects.length}\n`, '0000000000 65535 f \n'];
    for (let n = 1; n < this.objects.length; n++) xref.push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
    const trailer =
      `trailer\n<< /Size ${this.objects.length} /Root ${root} 0 R${info ? ` /Info ${info} 0 R` : ''} /ID [<${id}> <${id}>]${extraTrailer} >>\n` +
      `startxref\n${offset}\n%%EOF\n`;
    chunks.push(Buffer.from(xref.join('') + trailer, 'latin1'));
    return Buffer.concat(chunks);
  }
}

function serialize(body) {
  if (typeof body === 'string') return Buffer.from(body, 'latin1');
  let data = Buffer.isBuffer(body.data) ? body.data : Buffer.from(body.data, 'latin1');
  let dict = body.dict ?? '';
  if (body.deflate) {
    data = deflateSync(data, { level: 9 });
    dict += ' /Filter /FlateDecode';
  }
  return Buffer.concat([Buffer.from(`<< ${dict} /Length ${data.length} >>\nstream\n`, 'latin1'), data, Buffer.from('\nendstream', 'latin1')]);
}

/** A literal string for ASCII text: (…) with the special characters escaped. */
export function str(s) {
  return `(${s.replace(/[\\()]/g, (c) => `\\${c}`)})`;
}

/** A hex string of the text in UTF-16BE, for UCS-2 CMaps (BMP characters only). */
export function ucs2(s) {
  const le = Buffer.from(s, 'utf16le');
  const be = Buffer.alloc(le.length);
  for (let i = 0; i < le.length; i += 2) [be[i], be[i + 1]] = [le[i + 1], le[i]];
  return `<${be.toString('hex').toUpperCase()}>`;
}

/** A text string for the document's own strings (Info, bookmarks): ASCII as a literal, anything else as UTF-16BE with a BOM. */
export function textString(s) {
  return /^[\x20-\x7e]*$/.test(s) ? str(s) : `<FEFF${ucs2(s).slice(1, -1)}>`;
}

/** The standard 14 fonts as simple font dictionaries. */
export const BASE14 = {
  Helv: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  HelvB: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  Times: '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>',
  TimesI: '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>',
  Cour: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
  Symb: '<< /Type /Font /Subtype /Type1 /BaseFont /Symbol >>',
  Zapf: '<< /Type /Font /Subtype /Type1 /BaseFont /ZapfDingbats >>',
};

/**
 * A CJK font the file doesn't embed, as Word and many Chinese tools write it: a Type 0 font over a CIDFontType0
 * with an Adobe character collection. The reader has to find an installed font for it.
 */
export function cjkFont(pdf, { baseFont, encoding, ordering, supplement = 4, serif = true }) {
  const descriptor = pdf.add(
    `<< /Type /FontDescriptor /FontName /${baseFont} /Flags ${serif ? 6 : 4} /FontBBox [-25 -254 1000 880] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 93 >>`,
  );
  const cid = pdf.add(
    `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /${baseFont} /CIDSystemInfo << /Registry (Adobe) /Ordering (${ordering}) /Supplement ${supplement} >> /FontDescriptor ${descriptor} 0 R /DW 1000 >>`,
  );
  return pdf.add(`<< /Type /Font /Subtype /Type0 /BaseFont /${baseFont}-${encoding} /Encoding /${encoding} /DescendantFonts [${cid} 0 R] >>`);
}

/** Resources dictionary from { fonts: {name: objNum|string}, xobjects, extgstates, shadings, patterns, properties, colorspaces }. */
export function resources({ fonts = {}, xobjects = {}, extgstates = {}, shadings = {}, patterns = {}, properties = {}, colorspaces = {} } = {}) {
  const part = (key, map) => {
    const entries = Object.entries(map);
    if (!entries.length) return '';
    return ` /${key} << ${entries.map(([k, v]) => `/${k} ${typeof v === 'number' ? `${v} 0 R` : v}`).join(' ')} >>`;
  };
  return `<<${part('Font', fonts)}${part('XObject', xobjects)}${part('ExtGState', extgstates)}${part('Shading', shadings)}${part('Pattern', patterns)}${part('Properties', properties)}${part('ColorSpace', colorspaces)} >>`;
}

/**
 * A document under construction: add fonts, images and other objects through `pdf`, then pages, then finish().
 *
 *   const d = new Doc();
 *   const f = cjkFont(d.pdf, {...});
 *   d.page({ content, resources: resources({ fonts: { F: f } }) });
 *   out('X.pdf', d.finish({ catalog: ' /PageMode /UseOutlines' }));
 */
export class Doc {
  constructor({ version } = {}) {
    this.pdf = new Pdf({ version });
    this.root = this.pdf.reserve();
    this.pagesNum = this.pdf.reserve();
    this.pageNums = [];
    this.contentNums = [];
    this.reserved = [];
  }

  /** Reserves object numbers for the next n pages, so links and bookmarks can point forward. */
  reservePages(n) {
    for (let i = 0; i < n; i++) this.reserved.push(this.pdf.reserve());
    return [...this.reserved];
  }

  /** Adds a page and returns its object number. `annots` are object numbers or inline dictionaries. */
  page({ content, resources: res = '<< >>', size = [612, 792], annots = [], extra = '', deflate = false }) {
    const c = this.pdf.add({ dict: '', data: content, deflate });
    const a = annots.length ? ` /Annots [${annots.map((x) => (typeof x === 'number' ? `${x} 0 R` : x)).join(' ')}]` : '';
    const body = `<< /Type /Page /Parent ${this.pagesNum} 0 R /MediaBox [0 0 ${size[0]} ${size[1]}] /Resources ${res} /Contents ${c} 0 R${a}${extra} >>`;
    const n = this.reserved.length ? this.pdf.set(this.reserved.shift(), body) : this.pdf.add(body);
    this.pageNums.push(n);
    this.contentNums.push(c);
    return n;
  }

  finish({ catalog = '', info, extraTrailer } = {}) {
    this.pdf.set(this.pagesNum, `<< /Type /Pages /Kids [${this.pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${this.pageNums.length} >>`);
    this.pdf.set(this.root, `<< /Type /Catalog /Pages ${this.pagesNum} 0 R${catalog} >>`);
    const infoNum = info ? this.pdf.add(info) : undefined;
    return this.pdf.build({ root: this.root, info: infoNum, extraTrailer });
  }
}

/** Builds an outline tree from [{ title, page (object number), kids: [...] }]; returns the Outlines object number. */
export function outline(pdf, items) {
  const root = pdf.reserve();
  const place = (list, parent) => {
    const nums = list.map(() => pdf.reserve());
    list.forEach((it, i) => {
      const kids = it.kids?.length ? place(it.kids, nums[i]) : null;
      const k = kids ? ` /First ${kids[0]} 0 R /Last ${kids.at(-1)} 0 R /Count ${kids.length}` : '';
      const dest = it.dest ?? `[${it.page} 0 R /Fit]`;
      pdf.set(nums[i], `<< /Title ${textString(it.title)} /Parent ${parent} 0 R /Dest ${dest}${i ? ` /Prev ${nums[i - 1]} 0 R` : ''}${i < list.length - 1 ? ` /Next ${nums[i + 1]} 0 R` : ''}${k} >>`);
    });
    return nums;
  };
  const top = place(items, root);
  pdf.set(root, `<< /Type /Outlines /First ${top[0]} 0 R /Last ${top.at(-1)} 0 R /Count ${top.length} >>`);
  return root;
}

/** Lines of text in one font, top-down from y, as a content stream fragment. */
export function textLines(font, size, x, y, lines, leading = size * 1.35) {
  const out = ['BT', `/${font} ${size} Tf`, `${leading.toFixed(2)} TL`, `${x} ${y} Td`];
  lines.forEach((line, i) => out.push(`${i ? 'T* ' : ''}${line.startsWith('<') ? line : str(line)} Tj`));
  out.push('ET');
  return out.join('\n');
}

/** Breaks text into lines of at most `width` characters, at spaces. */
export function wrap(text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/** Breaks Chinese text into lines of `n` characters. */
export function wrapHan(text, n) {
  const chars = [...text];
  const lines = [];
  for (let i = 0; i < chars.length; i += n) lines.push(chars.slice(i, i + n).join(''));
  return lines;
}

/** An image XObject from raw samples. */
export function image(pdf, { width, height, colorSpace = '/DeviceRGB', bpc = 8, data, smask, extra = '' }) {
  return pdf.add({
    dict: `/Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace ${colorSpace} /BitsPerComponent ${bpc}${smask ? ` /SMask ${smask} 0 R` : ''}${extra}`,
    data,
    deflate: true,
  });
}
