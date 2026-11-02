// RD probes: text in the standard fonts, Chinese, Japanese and Korean text without embedded fonts,
// graphics, images, layers, navigation and reading order.

import { BASE14, Doc, cjkFont, image, outline, resources, str, textLines, ucs2, wrap, wrapHan } from '../lib/pdf.mjs';
import { enParagraph, enTitle, rng, zhParagraph } from '../lib/text.mjs';

// '宋体：中文字体测试。黑体、楷体和仿宋。' in GBK, as Chinese books made on Windows encode it (GBK-EUC-H).
const GBK_SENTENCE = '<cbcecce5a3bad6d0cec4d7d6cce5b2e2cad4a1a3badacce5a1a2bfaccce5bacdb7c2cbcea1a3>';

/** The first lines of every probe page: its id, title and what a correct result looks like. */
export const header = (id, title, expected) =>
  [textLines('HelvB', 16, 50, 750, [`${id}  ${title}`]), textLines('Helv', 9, 50, 728, wrap(`Expected: ${expected}`, 110))].join('\n');

export function build(out) {
  // RD-TXT-01: the standard 14 fonts, which no PDF needs to embed.
  {
    const rand = rng(101);
    const d = new Doc();
    d.page({
      content: [
        header('RD-TXT-01', 'Standard fonts', 'every line in its own face; Symbol shows Greek letters, ZapfDingbats shows symbols, not letters.'),
        textLines('Helv', 12, 50, 690, ['Helvetica: ' + enTitle(rand), ...wrap(enParagraph(rand, 3), 90)]),
        textLines('HelvB', 12, 50, 600, ['Helvetica-Bold: ' + enTitle(rand)]),
        textLines('Times', 12, 50, 575, ['Times-Roman: ' + enTitle(rand), ...wrap(enParagraph(rand, 3), 95)]),
        textLines('TimesI', 12, 50, 490, ['Times-Italic: ' + enTitle(rand)]),
        textLines('Cour', 11, 50, 465, ['Courier: 0123456789 ~!@#$%^&*_+-=[]{};:,./<>?']),
        textLines('Symb', 14, 50, 440, ['abgdepqlmnpsw  ABGDEFQLPSW']),
        textLines('Zapf', 14, 50, 415, ['3456789:;<=>?@ABCDE']),
        textLines('Helv', 11, 50, 380, ['WinAnsi: caf\xe9 na\xefve r\xe9sum\xe9 \xc5ngstr\xf6m \xab quotes \xbb \x96 en dash \x97 em dash \x80 euro']),
      ].join('\n'),
      resources: resources({ fonts: BASE14 }),
    });
    out('RD-TXT-01.pdf', d.finish(), { case: 'RD-TXT-01', purpose: 'Standard 14 fonts, not embedded' });
  }

  // RD-TXT-02: Chinese without embedded fonts, UCS-2 and GBK encodings, four families.
  {
    const rand = rng(102);
    const d = new Doc();
    const families = [
      ['STSong-Light', '宋体'],
      ['SimSun', '宋体'],
      ['SimHei', '黑体'],
      ['KaiTi', '楷体'],
      ['FangSong', '仿宋'],
    ];
    const fonts = { ...BASE14 };
    const parts = [header('RD-TXT-02', 'Chinese text, fonts not embedded (UniGB-UCS2-H)', 'five blocks, each in a different Chinese face; no blank page, no boxes. Copying and searching give the same characters.')];
    let y = 690;
    families.forEach(([base, label], i) => {
      fonts[`F${i}`] = cjkFont(d.pdf, { baseFont: base, encoding: 'UniGB-UCS2-H', ordering: 'GB1', serif: base !== 'SimHei' });
      const para = wrapHan(zhParagraph(rand, 2), 30).map(ucs2);
      parts.push(textLines('Helv', 9, 50, y + 14, [`/BaseFont ${base}`]));
      parts.push(textLines(`F${i}`, 13, 50, y, [ucs2(label), ...para]));
      y -= 46 + para.length * 17.5;
    });
    d.page({ content: parts.join('\n'), resources: resources({ fonts }) });

    const gbk = { ...BASE14 };
    const gbkParts = [header('RD-TXT-02', 'page 2: GBK-EUC-H, the encoding of Chinese books made on Windows', 'the same sentence four times, in Song, Hei, Kai and FangSong, each in its own face, none blank.')];
    ['SimSun', 'SimHei', 'KaiTi', 'FangSong'].forEach((base, i) => {
      gbk[`G${i}`] = cjkFont(d.pdf, { baseFont: base, encoding: 'GBK-EUC-H', ordering: 'GB1', serif: base !== 'SimHei' });
      gbkParts.push(textLines(`G${i}`, 16, 50, 680 - i * 40, [GBK_SENTENCE]));
    });
    d.page({ content: gbkParts.join('\n'), resources: resources({ fonts: gbk }) });
    out('RD-TXT-02.pdf', d.finish(), { case: 'RD-TXT-02', purpose: 'Chinese text in fonts the file does not embed (UniGB-UCS2-H and GBK-EUC-H)' });
  }

  // RD-TXT-03: vertical Chinese.
  {
    const rand = rng(103);
    const d = new Doc();
    const v = cjkFont(d.pdf, { baseFont: 'STSong-Light', encoding: 'UniGB-UCS2-V', ordering: 'GB1' });
    const body = [header('RD-TXT-03', 'Vertical Chinese (UniGB-UCS2-V)', 'columns read top to bottom, right to left; commas and full stops sit in the upper right of their cell.')];
    wrapHan(zhParagraph(rand, 5), 24)
      .slice(0, 16)
      .forEach((col, i) => body.push(`BT /V 16 Tf ${540 - i * 28} 690 Td ${ucs2(col)} Tj ET`));
    d.page({ content: body.join('\n'), resources: resources({ fonts: { ...BASE14, V: v } }) });
    out('RD-TXT-03.pdf', d.finish(), { case: 'RD-TXT-03', purpose: 'Vertical Chinese text, font not embedded' });
  }

  // RD-TXT-04: Japanese and Korean without embedded fonts.
  {
    const d = new Doc();
    const j = cjkFont(d.pdf, { baseFont: 'KozMinPro-Regular', encoding: 'UniJIS-UCS2-H', ordering: 'Japan1' });
    const k = cjkFont(d.pdf, { baseFont: 'HYSMyeongJo-Medium', encoding: 'UniKS-UCS2-H', ordering: 'Korea1', supplement: 1 });
    d.page({
      content: [
        header('RD-TXT-04', 'Japanese and Korean, fonts not embedded', 'readable Japanese and Korean text, no boxes, no blank lines.'),
        textLines('J', 16, 50, 680, [ucs2('日本語のテキストです。ひらがな、カタカナ、漢字。'), ucs2('横書きの段落で、フォントは埋め込まれていません。')]),
        textLines('K', 16, 50, 600, [ucs2('한국어 텍스트입니다. 글꼴이 포함되지 않았습니다.')]),
      ].join('\n'),
      resources: resources({ fonts: { ...BASE14, J: j, K: k } }),
    });
    out('RD-TXT-04.pdf', d.finish(), { case: 'RD-TXT-04', purpose: 'Japanese and Korean text, fonts not embedded' });
  }

  // RD-GFX-01: shadings, blend modes and transparency.
  {
    const d = new Doc();
    const axial = d.pdf.add('<< /ShadingType 2 /ColorSpace /DeviceRGB /Coords [50 0 300 0] /Function << /FunctionType 2 /Domain [0 1] /C0 [0.9 0.2 0.1] /C1 [0.1 0.3 0.9] /N 1 >> /Extend [true true] >>');
    const radial = d.pdf.add('<< /ShadingType 3 /ColorSpace /DeviceRGB /Coords [450 560 0 450 560 90] /Function << /FunctionType 2 /Domain [0 1] /C0 [1 1 0.3] /C1 [0 0.5 0.2] /N 1 >> /Extend [false true] >>');
    const modes = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'Difference', 'Color', 'Luminosity'];
    const gs = { A50: '<< /ca 0.5 /CA 0.5 >>' };
    modes.forEach((m, i) => (gs[`B${i}`] = `<< /BM /${m} >>`));
    d.page({
      content: [
        header('RD-GFX-01', 'Shadings, blend modes, transparency', 'a smooth red-to-blue band, a yellow-green radial disc, nine blend-mode squares that match the reference app square by square, and a half-transparent overlap.'),
        'q 50 640 250 60 re W n /Sh0 sh Q',
        'q 360 470 180 180 re W n /Sh1 sh Q',
        ...modes.map((m, i) => {
          const x = 50 + (i % 3) * 110;
          const y = 450 - Math.floor(i / 3) * 110;
          return `q 0.2 0.6 1 rg ${x} ${y} 80 80 re f /B${i} gs 1 0.4 0.1 rg ${x + 30} ${y + 30} 80 80 re f Q\n${textLines('Helv', 8, x, y - 12, [m])}`;
        }),
        'q /A50 gs 0 0.6 0 rg 380 150 150 150 re f 0.8 0 0.6 rg 440 210 120 120 re f Q',
      ].join('\n'),
      resources: resources({ fonts: BASE14, shadings: { Sh0: axial, Sh1: radial }, extgstates: gs }),
    });
    out('RD-GFX-01.pdf', d.finish(), { case: 'RD-GFX-01', purpose: 'Axial and radial shadings, nine blend modes, constant alpha' });
  }

  // RD-GFX-02: a luminosity soft mask and an isolated CMYK transparency group.
  {
    const d = new Doc();
    const mask = d.pdf.add({
      dict: '/Type /XObject /Subtype /Form /BBox [0 0 612 792] /Group << /S /Transparency /CS /DeviceGray >>',
      data: 'q 1 g 0 0 612 792 re f 0 g 120 320 160 160 re f 0.5 g 330 320 160 160 re f Q',
    });
    const cmyk = d.pdf.add({
      dict: '/Type /XObject /Subtype /Form /BBox [0 0 612 792] /Group << /S /Transparency /CS /DeviceCMYK /I true >> /Resources << /ExtGState << /M << /BM /Multiply >> >> >>',
      data: 'q 0 1 1 0 k 80 80 200 150 re f /M gs 1 0 0 0 k 180 120 200 150 re f Q',
    });
    d.page({
      content: [
        header('RD-GFX-02', 'Soft mask and CMYK group', 'the blue band has a hole where the mask is black (left square) and is half visible where it is grey (right square); below, a red and a cyan rectangle overlap and the overlap, multiplied in CMYK, is almost black.'),
        'q /SM gs 0.1 0.3 0.9 rg 60 300 480 200 re f Q',
        'q /Cmyk Do Q',
      ].join('\n'),
      resources: resources({
        fonts: BASE14,
        extgstates: { SM: `<< /SMask << /S /Luminosity /G ${mask} 0 R >> >>` },
        xobjects: { Cmyk: cmyk },
      }),
    });
    out('RD-GFX-02.pdf', d.finish(), { case: 'RD-GFX-02', purpose: 'Luminosity soft mask; isolated DeviceCMYK transparency group' });
  }

  // RD-GFX-03: a coloured tiling pattern, the kind TikZ writes.
  {
    const d = new Doc();
    const pattern = d.pdf.add({
      dict: '/Type /Pattern /PatternType 1 /PaintType 1 /TilingType 1 /BBox [0 0 20 20] /XStep 20 /YStep 20 /Resources << >>',
      data: '0.9 0.3 0.1 rg 0 0 10 10 re f 0.1 0.4 0.8 rg 10 10 10 10 re f 0 G 0.5 w 0 20 m 20 0 l S',
    });
    d.page({
      content: [
        header('RD-GFX-03', 'Tiling pattern', 'an orange and blue checker with thin diagonal lines fills the circle and the square, the same size as in the reference app.'),
        'q /Pattern cs /P0 scn 306 540 m 306 595 261 640 206 640 c 151 640 106 595 106 540 c 106 485 151 440 206 440 c 261 440 306 485 306 540 c h f Q',
        'q /Pattern cs /P0 scn 330 440 200 200 re f Q',
      ].join('\n'),
      resources: resources({ fonts: BASE14, patterns: { P0: pattern } }),
    });
    out('RD-GFX-03.pdf', d.finish(), { case: 'RD-GFX-03', purpose: 'Coloured tiling pattern' });
  }

  // RD-IMG-01: images in RGB, grey, one bit, and with a soft mask.
  {
    const d = new Doc();
    const W = 200;
    const H = 150;
    const rgb = Buffer.alloc(W * H * 3);
    const grey = Buffer.alloc(W * H);
    const alpha = Buffer.alloc(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        rgb[i * 3] = Math.round((x * 255) / W);
        rgb[i * 3 + 1] = Math.round((y * 255) / H);
        rgb[i * 3 + 2] = ((x ^ y) & 16) * 12;
        grey[i] = Math.round(((x + y) * 255) / (W + H));
        alpha[i] = Math.max(0, 255 - Math.round(Math.hypot(x - W / 2, y - H / 2) * 3));
      }
    const row = Math.ceil(W / 8);
    const mono = Buffer.alloc(row * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x >> 3) + (y >> 3)) % 2) mono[y * row + (x >> 3)] |= 0x80 >> (x & 7);
    const sm = image(d.pdf, { width: W, height: H, colorSpace: '/DeviceGray', data: alpha });
    const xobjects = {
      I1: image(d.pdf, { width: W, height: H, data: rgb }),
      I2: image(d.pdf, { width: W, height: H, colorSpace: '/DeviceGray', data: grey }),
      I3: image(d.pdf, { width: W, height: H, colorSpace: '/DeviceGray', bpc: 1, data: mono }),
      I4: image(d.pdf, { width: W, height: H, data: rgb, smask: sm }),
    };
    d.page({
      content: [
        header('RD-IMG-01', 'Images', 'top left: colour gradient; top right: grey gradient; bottom left: black-and-white checker; bottom right: the colour image fading out from its centre over a red square.'),
        'q 240 0 0 180 50 500 cm /I1 Do Q',
        'q 240 0 0 180 320 500 cm /I2 Do Q',
        'q 240 0 0 180 50 260 cm /I3 Do Q',
        'q 1 0 0 rg 330 270 220 160 re f Q q 240 0 0 180 320 260 cm /I4 Do Q',
      ].join('\n'),
      resources: resources({ fonts: BASE14, xobjects }),
    });
    out('RD-IMG-01.pdf', d.finish(), { case: 'RD-IMG-01', purpose: 'RGB, grey, 1-bit and soft-masked images' });
  }

  // RD-OCG-01: optional content, one layer off by default and one for print only.
  {
    const d = new Doc();
    const on = d.pdf.add('<< /Type /OCG /Name (Visible notes) >>');
    const off = d.pdf.add('<< /Type /OCG /Name (Hidden by default) >>');
    const print = d.pdf.add('<< /Type /OCG /Name (Print only) /Usage << /View << /ViewState /OFF >> /Print << /PrintState /ON >> >> >>');
    d.page({
      content: [
        header('RD-OCG-01', 'Layers', 'three layers in the Layers panel; "Hidden by default" starts off; "Print only" is hidden on screen and printed. Switching a layer redraws the page at once.'),
        `/OC /L1 BDC\n${textLines('Helv', 16, 50, 650, ['Layer 1: Visible notes (on)'])}\nEMC`,
        `/OC /L2 BDC\n${textLines('Helv', 16, 50, 600, ['Layer 2: Hidden by default (off)'])}\nq 1 0 0 rg 50 570 300 20 re f Q\nEMC`,
        `/OC /L3 BDC\n${textLines('Helv', 16, 50, 500, ['Layer 3: Print only'])}\nEMC`,
        textLines('Helv', 12, 50, 450, ['This line belongs to no layer and always shows.']),
      ].join('\n'),
      resources: resources({ fonts: BASE14, properties: { L1: on, L2: off, L3: print } }),
    });
    const ocgs = `[${on} 0 R ${off} 0 R ${print} 0 R]`;
    out(
      'RD-OCG-01.pdf',
      d.finish({
        catalog: ` /OCProperties << /OCGs ${ocgs} /D << /Order ${ocgs} /OFF [${off} 0 R] /AS [<< /Event /View /OCGs [${print} 0 R] /Category [/View] >> << /Event /Print /OCGs [${print} 0 R] /Category [/Print] >>] >> >> /PageMode /UseOC`,
      }),
      { case: 'RD-OCG-01', purpose: 'Optional content: on, off by default, print only' },
    );
  }

  // RD-NAV-01: 30 pages with nested bookmarks, page labels, internal links and a named destination.
  {
    const rand = rng(106);
    const N = 30;
    const d = new Doc();
    const pages = d.reservePages(N);
    const label = (i) => (i < 4 ? ['i', 'ii', 'iii', 'iv'][i] : String(i - 3));
    const links = [
      d.pdf.add(`<< /Type /Annot /Subtype /Link /Rect [50 300 330 318] /Border [0 0 1] /Dest [${pages[19]} 0 R /XYZ null null null] >>`),
      d.pdf.add('<< /Type /Annot /Subtype /Link /Rect [50 270 330 288] /Border [0 0 1] /Dest (appendix) >>'),
      d.pdf.add('<< /Type /Annot /Subtype /Link /Rect [50 240 330 258] /Border [0 0 1] /A << /S /URI /URI (https://example.com/getpdfcraft-test) >> >>'),
    ];
    for (let i = 0; i < N; i++) {
      const parts = [
        textLines('HelvB', 26, 50, 720, [i < 4 ? `Front matter, page ${label(i)}` : `Chapter ${Math.ceil((i - 3) / 9)}, page ${label(i)}`]),
        textLines('Times', 12, 50, 680, [`Index page ${i + 1} of ${N}; page label ${label(i)}.`, ...wrap(enParagraph(rand, 6), 95)]),
      ];
      if (i === 0) {
        parts.push(header('RD-NAV-01', 'Navigation', 'bookmarks nested three deep, page labels i-iv then 1-26, three links below: two jump, the web link asks before opening.'));
        parts.push(textLines('Helv', 12, 55, 305, ['Link: go to index page 20 (label 16)', 'Link: go to the named destination "appendix" (index page 28)', 'Link: https://example.com/getpdfcraft-test'], 30));
      }
      d.page({ content: parts.join('\n'), resources: resources({ fonts: BASE14 }), annots: i === 0 ? links : [] });
    }
    const p = (i) => pages[i];
    const outlines = outline(d.pdf, [
      { title: 'Front matter', page: p(0), kids: ['i', 'ii', 'iii', 'iv'].map((t, i) => ({ title: `Page ${t}`, page: p(i) })) },
      { title: 'Chapter 1', page: p(4), kids: [{ title: 'Section 1.1', page: p(5) }, { title: 'Section 1.2', page: p(7) }, { title: 'Section 1.3', page: p(9) }] },
      { title: 'Chapter 2', page: p(13) },
      { title: 'Chapter 3', page: p(22), kids: [{ title: 'Section 3.1', page: p(23), kids: [{ title: 'Section 3.1.1 (three deep)', page: p(24) }] }] },
      { title: 'Appendix (named destination)', page: p(27), dest: '(appendix)' },
      { title: '中文书签：附录', page: p(28) },
    ]);
    const dests = d.pdf.add(`<< /Names [(appendix) [${p(27)} 0 R /XYZ 0 792 null]] >>`);
    out(
      'RD-NAV-01.pdf',
      d.finish({ catalog: ` /Outlines ${outlines} 0 R /PageMode /UseOutlines /PageLabels << /Nums [0 << /S /r >> 4 << /S /D >>] >> /Names << /Dests ${dests} 0 R >>` }),
      { case: 'RD-NAV-01', purpose: '30 pages: nested bookmarks (one in Chinese), roman and arabic page labels, GoTo, named and URI links' },
    );
  }

  // RD-FIND-01: two columns with a footnote, and a known count for search.
  {
    const rand = rng(107);
    const d = new Doc();
    d.page({
      content: [
        header('RD-FIND-01', 'Two columns and a footnote', 'select-all and copy gives the left column, then the right, then the footnote; a search for the test word that starts each column finds it exactly 4 times.'),
        textLines('Times', 11, 50, 680, ['marker: start of the left column.', ...wrap(enParagraph(rand, 9), 42)]),
        textLines('Times', 11, 320, 680, ['marker: start of the right column.', ...wrap(enParagraph(rand, 9), 42)]),
        textLines('Times', 11, 50, 150, ['End of the left column, with a note.1']),
        'q 0.5 w 50 125 m 200 125 l S Q',
        textLines('Times', 9, 50, 110, ['1 marker: this footnote comes last in reading order. marker']),
      ].join('\n'),
      resources: resources({ fonts: BASE14 }),
    });
    out('RD-FIND-01.pdf', d.finish(), { case: 'RD-FIND-01', purpose: 'Reading order across two columns and a footnote; search count' });
  }
}

/** Used by other probe files. */
export { str };
