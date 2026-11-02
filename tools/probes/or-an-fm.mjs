// OR, AN and FM probes: files to organize, combine and split; files to comment on; forms.

import { BASE14, Doc, outline, resources, str, textLines, textString, wrap } from '../lib/pdf.mjs';
import { enParagraph, rng } from '../lib/text.mjs';
import { header } from './rd.mjs';

const fontsOnly = resources({ fonts: BASE14 });
const big = (label) => textLines('HelvB', 72, 50, 380, [label]);

export function build(out) {
  // OR-SRC-A: 10 pages, each with a big id and a unique token, bookmarks, a named destination and internal links.
  {
    const rand = rng(301);
    const d = new Doc();
    const pages = d.reservePages(10);
    for (let i = 0; i < 10; i++) {
      const id = `A-${String(i + 1).padStart(2, '0')}`;
      const annots =
        i === 0
          ? [
              d.pdf.add(`<< /Type /Annot /Subtype /Link /Rect [50 150 300 168] /Border [0 0 1] /Dest [${pages[6]} 0 R /Fit] >>`),
              d.pdf.add('<< /Type /Annot /Subtype /Link /Rect [50 120 300 138] /Border [0 0 1] /Dest (a-target) >>'),
            ]
          : [];
      d.page({
        content: [
          i === 0 ? header('OR-SRC-A', 'File A for organizing and combining', 'ten pages A-01 to A-10, each with its own token; two links on this page go to A-07 and to the named destination on A-09.') : '',
          big(id),
          textLines('Helv', 12, 50, 320, [`Page token GPCPAGE-${id}`]),
          textLines('Times', 11, 50, 290, wrap(enParagraph(rand, 3), 95)),
          i === 0 ? textLines('Helv', 12, 55, 155, ['Link to A-07', 'Link to the named destination (A-09)'], 30) : '',
        ].join('\n'),
        resources: fontsOnly,
        annots,
      });
    }
    const marks = outline(d.pdf, [
      { title: 'A: part one', page: pages[0], kids: [{ title: 'A-02', page: pages[1] }, { title: 'A-03', page: pages[2] }] },
      { title: 'A: part two', page: pages[5], kids: [{ title: 'A-09 (named)', page: pages[8], dest: '(a-target)' }] },
    ]);
    const dests = d.pdf.add(`<< /Names [(a-target) [${pages[8]} 0 R /XYZ 0 792 null]] >>`);
    out('OR-SRC-A.pdf', d.finish({ catalog: ` /Outlines ${marks} 0 R /Names << /Dests ${dests} 0 R >> /PageLabels << /Nums [0 << /P (A-) /S /D >>] >>` }), {
      case: 'OR-ROT-01 OR-DEL-01 OR-INS-01 OR-EXT-01 OR-SPL-01 OR-CMB-01',
      purpose: '10 numbered pages with bookmarks, a named destination, links and page labels A-1…',
    });
  }

  // OR-SRC-B: 3 pages with form fields (combined with A, the fields must stay fillable).
  {
    const d = new Doc();
    const fields = [];
    for (let i = 0; i < 3; i++) {
      const f = d.pdf.add(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (b_name_${i + 1}) /V (B value ${i + 1}) /DA (/Helv 12 Tf 0 g) /Rect [50 500 350 524] /MK << /BC [0 0 0] /BG [0.95 0.95 1] >> /F 4 >>`);
      fields.push(f);
      d.page({ content: [i === 0 ? header('OR-SRC-B', 'File B: form fields', 'three pages B-01 to B-03 with one text field each.') : '', big(`B-0${i + 1}`), textLines('Helv', 12, 50, 540, [`Field b_name_${i + 1}:`])].join('\n'), resources: fontsOnly, annots: [f] });
    }
    out('OR-SRC-B.pdf', d.finish({ catalog: ` /AcroForm << /Fields [${fields.map((f) => `${f} 0 R`).join(' ')}] /DA (/Helv 12 Tf 0 g) /DR << /Font << /Helv ${BASE14.Helv} >> >> /NeedAppearances true >>` }), {
      case: 'OR-CMB-01',
      purpose: 'Form fields to carry through Combine',
    });
  }

  // OR-SRC-C: 2 pages with a layer that is off and an attachment.
  {
    const d = new Doc();
    const layer = d.pdf.add('<< /Type /OCG /Name (C draft notes) >>');
    const file = d.pdf.add({ dict: '/Type /EmbeddedFile /Subtype /text#2Fplain', data: 'Attachment of file C.\n' });
    const spec = d.pdf.add(`<< /Type /Filespec /F (c-notes.txt) /UF (c-notes.txt) /EF << /F ${file} 0 R >> >>`);
    for (let i = 0; i < 2; i++)
      d.page({
        content: [i === 0 ? header('OR-SRC-C', 'File C: layer and attachment', 'pages C-01 and C-02; a layer "C draft notes" that starts off; an attachment c-notes.txt.') : '', big(`C-0${i + 1}`), `/OC /L BDC\n${textLines('Helv', 16, 50, 300, ['C draft notes: hidden until the layer is switched on'])}\nEMC`].join('\n'),
        resources: resources({ fonts: BASE14, properties: { L: layer } }),
      });
    out('OR-SRC-C.pdf', d.finish({ catalog: ` /OCProperties << /OCGs [${layer} 0 R] /D << /OFF [${layer} 0 R] >> >> /Names << /EmbeddedFiles << /Names [(c-notes.txt) ${spec} 0 R] >> >>` }), {
      case: 'OR-CMB-01',
      purpose: 'A layer that is off and an attachment to carry through Combine',
    });
  }

  // OR-SIZES: pages of different sizes and rotations.
  {
    const d = new Doc();
    const sizes = [
      ['A4 portrait', [595, 842], 0],
      ['US Letter landscape (rotated 90)', [612, 792], 90],
      ['A5 portrait', [420, 595], 0],
      ['A3 landscape', [1191, 842], 0],
      ['Square, /Rotate 270', [500, 500], 270],
    ];
    sizes.forEach(([label, size, rot], i) =>
      d.page({ content: [i === 0 ? header('OR-SIZES', 'Mixed sizes and rotations', 'five pages, each labelled; thumbnails and printing keep each size and rotation.') : '', textLines('HelvB', 24, 40, size[1] - 120, [`S-0${i + 1} ${label}`])].join('\n'), resources: fontsOnly, size, extra: rot ? ` /Rotate ${rot}` : '' }),
    );
    out('OR-SIZES.pdf', d.finish(), { case: 'OR-ROT-01 OR-CRP-01 AN-ROT-01', purpose: 'Mixed page sizes and /Rotate values' });
  }

  // AN-BASE: three plain pages to comment on, one with Chinese text.
  {
    const rand = rng(401);
    const d = new Doc();
    for (let i = 0; i < 3; i++)
      d.page({ content: [i === 0 ? header('AN-BASE', 'Pages to comment on', 'plain text for every kind of comment; see suites/an-comments.md.') : '', textLines('Times', 12, 50, 690, wrap(enParagraph(rand, 12), 90))].join('\n'), resources: fontsOnly });
    out('AN-BASE.pdf', d.finish(), { case: 'AN-ADD-01 AN-THR-01 AN-CJK-01 AN-FLAT-01', purpose: 'Plain pages for adding comments' });
  }

  // AN-EXIST: comments of many kinds already in the file, with a reply thread.
  {
    const d = new Doc();
    const rand = rng(402);
    const lines = wrap(enParagraph(rand, 8), 80);
    const text = textLines('Times', 12, 50, 650, lines, 16);
    const y = (n) => 650 - n * 16;
    const q = (x1, n, x2) => `/QuadPoints [${x1} ${y(n) + 12} ${x2} ${y(n) + 12} ${x1} ${y(n) - 3} ${x2} ${y(n) - 3}] /Rect [${x1} ${y(n) - 3} ${x2} ${y(n) + 12}]`;
    const note = d.pdf.add(`<< /Type /Annot /Subtype /Text /Rect [520 640 540 660] /Contents (A note with two replies.) /T (Reviewer One) /M (D:20261101100000Z) /Name /Comment /C [1 0.85 0.2] /NM (note-1) >>`);
    const reply1 = d.pdf.add(`<< /Type /Annot /Subtype /Text /Rect [520 640 540 660] /Contents (First reply.) /T (Reviewer Two) /M (D:20261101101000Z) /IRT ${note} 0 R /NM (reply-1) >>`);
    const reply2 = d.pdf.add(`<< /Type /Annot /Subtype /Text /Rect [520 640 540 660] /Contents ${textString('第二条回复，中文。')} /T ${textString('审阅人三')} /M (D:20261101102000Z) /IRT ${note} 0 R /NM (reply-2) >>`);
    const annots = [
      note,
      reply1,
      reply2,
      d.pdf.add(`<< /Type /Annot /Subtype /Highlight ${q(50, 0, 300)} /C [1 1 0] /T (Reviewer One) /Contents (Highlight) >>`),
      d.pdf.add(`<< /Type /Annot /Subtype /Underline ${q(50, 2, 260)} /C [0 0.5 1] /T (Reviewer One) /Contents (Underline) >>`),
      d.pdf.add(`<< /Type /Annot /Subtype /StrikeOut ${q(50, 4, 240)} /C [1 0 0] /T (Reviewer One) /Contents (Strikeout) >>`),
      d.pdf.add(`<< /Type /Annot /Subtype /Squiggly ${q(50, 6, 220)} /C [0 0.7 0] /T (Reviewer One) /Contents (Squiggly) >>`),
      d.pdf.add('<< /Type /Annot /Subtype /FreeText /Rect [330 420 560 470] /Contents (A text box typed on the page.) /DA (/Helv 12 Tf 0 0 1 rg) /T (Reviewer One) >>'),
      d.pdf.add('<< /Type /Annot /Subtype /Square /Rect [60 300 200 380] /C [1 0 0] /BS << /W 2 >> /T (Reviewer One) /Contents (Rectangle) >>'),
      d.pdf.add('<< /Type /Annot /Subtype /Circle /Rect [230 300 370 380] /C [0 0 1] /IC [0.8 0.9 1] /BS << /W 2 >> /T (Reviewer One) /Contents (Oval) >>'),
      d.pdf.add('<< /Type /Annot /Subtype /Line /Rect [380 290 560 390] /L [390 300 550 380] /LE [/None /OpenArrow] /C [0 0.6 0] /BS << /W 2 >> /T (Reviewer One) /Contents (Arrow) >>'),
      d.pdf.add('<< /Type /Annot /Subtype /Ink /Rect [60 180 300 260] /InkList [[70 200 110 250 150 190 190 250 230 200 290 240]] /C [0.6 0 0.6] /BS << /W 3 >> /T (Reviewer One) /Contents (Freehand) >>'),
      d.pdf.add('<< /Type /Annot /Subtype /Stamp /Rect [330 180 540 240] /Name /Approved /C [0 0.6 0] /T (Reviewer One) /Contents (Stamp) >>'),
    ];
    d.page({
      content: [header('AN-EXIST', 'Comments already in the file', 'thirteen comments: a note with two replies (one in Chinese), four text markups, a text box, rectangle, oval, arrow, freehand line and an Approved stamp, listed in the Comments panel as in the reference app.'), text].join('\n'),
      resources: fontsOnly,
      annots,
    });
    out('AN-EXIST.pdf', d.finish(), { case: 'AN-RD-01 AN-EXP-01', purpose: 'Every common comment type, with a reply thread, written without appearance streams' });
  }

  // FM-FORM: an AcroForm with every field type and Acrobat-style scripts.
  {
    const d = new Doc();
    const w = (o) => d.pdf.add(o);
    const DA = '/DA (/Helv 11 Tf 0 g)';
    const MK = '/MK << /BC [0 0 0] /BG [0.93 0.95 1] >>';
    const ap = (data) => w({ dict: '/Type /XObject /Subtype /Form /BBox [0 0 16 16] /Resources << >>', data });
    const apOff = ap('q 0 G 0.8 w 0.5 0.5 15 15 re S Q');
    const apTick = ap('q 0 G 0.8 w 0.5 0.5 15 15 re S 1.6 w 3 8 m 6.5 3.5 l 13 12.5 l S Q');
    const apDot = ap('q 0 G 0.8 w 0.5 0.5 15 15 re S 0 g 4 4 8 8 re f Q');
    const name = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (name) /TU (Full name) ${DA} ${MK} /Rect [180 640 450 660] /F 4 >>`);
    const notes = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (notes) /Ff 4096 ${DA} ${MK} /Rect [180 560 450 625] /F 4 >>`);
    const qty = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (qty) ${DA} ${MK} /Rect [180 520 260 540] /F 4 /AA << /F << /S /JavaScript /JS (AFNumber_Format\\(0, 0, 0, 0, "", true\\);) >> /K << /S /JavaScript /JS (AFNumber_Keystroke\\(0, 0, 0, 0, "", true\\);) >> >> >>`);
    const price = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (price) ${DA} ${MK} /Rect [280 520 360 540] /F 4 /AA << /F << /S /JavaScript /JS (AFNumber_Format\\(2, 0, 0, 0, "$", true\\);) >> >> >>`);
    const total = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (total) /Ff 1 ${DA} ${MK} /Rect [380 520 460 540] /F 4 /AA << /C << /S /JavaScript /JS (event.value = this.getField\\("qty"\\).value * this.getField\\("price"\\).value;) >> /F << /S /JavaScript /JS (AFNumber_Format\\(2, 0, 0, 0, "$", true\\);) >> >> >>`);
    const date = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (date) ${DA} ${MK} /Rect [180 480 300 500] /F 4 /AA << /F << /S /JavaScript /JS (AFDate_FormatEx\\("yyyy-mm-dd"\\);) >> /K << /S /JavaScript /JS (AFDate_KeystrokeEx\\("yyyy-mm-dd"\\);) >> >> >>`);
    const agree = w(`<< /Type /Annot /Subtype /Widget /FT /Btn /T (agree) /V /Off /AS /Off ${MK} /Rect [180 440 196 456] /F 4 /AP << /N << /Yes ${apTick} 0 R /Off ${apOff} 0 R >> >> >>`);
    const radioParent = w('<< /FT /Btn /Ff 49152 /T (size) /V /Off >>');
    const kids = ['S', 'M', 'L'].map((v, i) => w(`<< /Type /Annot /Subtype /Widget /Parent ${radioParent} 0 R /AS /Off ${MK} /Rect [${180 + i * 60} 400 ${196 + i * 60} 416] /F 4 /AP << /N << /${v} ${apDot} 0 R /Off ${apOff} 0 R >> >> >>`));
    d.pdf.set(radioParent, `<< /FT /Btn /Ff 49152 /T (size) /V /Off /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] >>`);
    const combo = w(`<< /Type /Annot /Subtype /Widget /FT /Ch /Ff 131072 /T (country) /Opt [(China) (Germany) (Japan) (United States)] ${DA} ${MK} /Rect [180 360 340 380] /F 4 >>`);
    const list = w(`<< /Type /Annot /Subtype /Widget /FT /Ch /T (topics) /Ff 2097152 /Opt [(Forms) (Comments) (Redaction) (Signatures)] ${DA} ${MK} /Rect [180 280 340 345] /F 4 >>`);
    const formula = w(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (formula_like) /V (=HYPERLINK\\("https://example.com","click"\\)) ${DA} ${MK} /Rect [180 240 450 260] /F 4 >>`);
    const sig = w(`<< /Type /Annot /Subtype /Widget /FT /Sig /T (signature) ${MK} /Rect [180 170 400 220] /F 4 >>`);
    const button = w(`<< /Type /Annot /Subtype /Widget /FT /Btn /Ff 65536 /T (hello) /MK << /BC [0 0 0] /BG [0.85 0.85 0.85] /CA (Say hello) >> /DA (/Helv 11 Tf 0 g) /Rect [420 170 520 195] /F 4 /A << /S /JavaScript /JS (app.alert\\({cMsg: "Hello from the form", cTitle: "Form script", nIcon: 3, nType: 0}\\);) >> >>`);
    const widgets = [name, notes, qty, price, total, date, agree, ...kids, combo, list, formula, sig, button];
    const labels = [
      ['Full name', 645],
      ['Notes (multi-line)', 610],
      ['Quantity / price / total', 525],
      ['Date (yyyy-mm-dd)', 485],
      ['I agree (checkbox)', 444],
      ['Size: S  M  L (radio)', 404],
      ['Country (drop-down)', 365],
      ['Topics (list box)', 330],
      ['Formula-like value', 245],
      ['Signature field', 190],
    ];
    d.page({
      content: [header('FM-FORM', 'Every field type', 'fill each field; the total is quantity x price, formatted as dollars; the date keeps yyyy-mm-dd; the button shows a message titled "Form script".'), ...labels.map(([l, yy]) => textLines('Helv', 11, 50, yy, [l]))].join('\n'),
      resources: fontsOnly,
      annots: widgets,
    });
    const top = [name, notes, qty, price, total, date, agree, radioParent, combo, list, formula, sig, button];
    out(
      'FM-FORM.pdf',
      d.finish({ catalog: ` /AcroForm << /Fields [${top.map((f) => `${f} 0 R`).join(' ')}] /CO [${total} 0 R] /DA (/Helv 11 Tf 0 g) /DR << /Font << /Helv ${BASE14.Helv} >> >> /NeedAppearances true >>` }),
      { case: 'FM-FILL-01 FM-JS-01 FM-JS-02 FM-DATA-01 FM-SIG-01', purpose: 'Text, multi-line, number, date, checkbox, radio, combo, list, signature and button fields with Acrobat-style scripts' },
    );
  }

  // FM-FLAT: a printed-style form with no fields, for detection and Fill & Sign.
  {
    const d = new Doc();
    const rows = ['Name', 'Date of birth', 'Address', 'City', 'Phone', 'E-mail'];
    d.page({
      content: [
        header('FM-FLAT', 'A flat form', 'no interactive fields; Detect form fields should find six text fields and two boxes; Fill & Sign can type on the lines.'),
        ...rows.map((r, i) => `${textLines('Helv', 12, 50, 650 - i * 40, [`${r}:`])}\nq 0.5 w 160 ${648 - i * 40} m 500 ${648 - i * 40} l S Q`),
        textLines('Helv', 12, 70, 380, ['I accept the terms']),
        'q 0.8 w 50 378 12 12 re S Q',
        textLines('Helv', 12, 70, 350, ['Send me a copy']),
        'q 0.8 w 50 348 12 12 re S Q',
        textLines('Helv', 12, 50, 280, ['Signature:']),
        'q 0.5 w 130 278 m 400 278 l S Q',
      ].join('\n'),
      resources: fontsOnly,
    });
    out('FM-FLAT.pdf', d.finish(), { case: 'FM-DET-01 FM-FS-01', purpose: 'A flat form: lines and boxes, no fields' });
  }
}

export { str };
