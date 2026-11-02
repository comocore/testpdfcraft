// SC probes: redaction, sanitizing, what a save keeps, scripts and links, and the source for the encrypted files.
// Every secret is a unique token (GPCSECRET-…); tools/scan-leaks.mjs searches a saved file for them.
// Tokens that must survive are GPCKEEP-…

import { BASE14, Doc, image, outline, resources, str, textLines, textString, wrap } from '../lib/pdf.mjs';
import { enParagraph, rng } from '../lib/text.mjs';
import { header } from './rd.mjs';

const box = (x, y, w, h, label) =>
  `q 0.85 0.1 0.1 RG 1 w [4 3] 0 d ${x} ${y} ${w} ${h} re S Q\n${textLines('Helv', 8, x, y + h + 4, [label])}`;

export function build(out) {
  const fonts = resources({ fonts: BASE14 });

  // SC-RED-01: plain text, one line to redact between two lines to keep, and a second copy on page 2.
  {
    const rand = rng(201);
    const d = new Doc();
    d.page({
      content: [
        header('SC-RED-01', 'Redact a line of text', 'after Apply, the token inside the red box is gone from the page and from the saved file; both GPCKEEP lines stay.'),
        textLines('Times', 12, 50, 680, wrap(enParagraph(rand, 3), 90)),
        textLines('Helv', 12, 50, 600, ['GPCKEEP-TEXT-0001 stays: the line above the secret.']),
        textLines('Helv', 12, 50, 570, ['Account: GPCSECRET-TEXT-0001']),
        box(45, 562, 260, 22, 'Redact this box'),
        textLines('Helv', 12, 50, 540, ['GPCKEEP-TEXT-0002 stays: the line below the secret.']),
      ].join('\n'),
      resources: fonts,
    });
    d.page({
      content: [header('SC-RED-01', 'page 2', 'this copy is only removed when you redact page 2 too (or use Find text and redact).'), textLines('Helv', 12, 50, 650, ['Account: GPCSECRET-TEXT-0001 (second copy)'])].join('\n'),
      resources: fonts,
    });
    out('SC-RED-01.pdf', d.finish(), { case: 'SC-RED-01', purpose: 'Redaction of one line of text', secrets: ['GPCSECRET-TEXT-0001'], keep: ['GPCKEEP-TEXT-0001', 'GPCKEEP-TEXT-0002'] });
  }

  // SC-RED-02: a token inside a form XObject that two pages share.
  {
    const d = new Doc();
    const form = d.pdf.add({
      dict: `/Type /XObject /Subtype /Form /BBox [0 0 300 40] /Resources ${fonts}`,
      data: textLines('Helv', 12, 5, 15, ['Shared block: GPCSECRET-XOBJ-0001']),
    });
    const res = resources({ fonts: BASE14, xobjects: { Fm: form } });
    d.page({
      content: [header('SC-RED-02', 'Redact text inside a form XObject', 'after Apply on page 1, the token is gone from page 1 but still on page 2, which shares the same block.'), 'q 1 0 0 1 50 600 cm /Fm Do Q', box(45, 597, 300, 30, 'Redact this box (page 1 only)')].join('\n'),
      resources: res,
    });
    d.page({ content: [header('SC-RED-02', 'page 2', 'the shared block below stays.'), 'q 1 0 0 1 50 600 cm /Fm Do Q'].join('\n'), resources: res });
    out('SC-RED-02.pdf', d.finish(), { case: 'SC-RED-02', purpose: 'Redaction inside a form XObject shared by two pages', secrets: ['GPCSECRET-XOBJ-0001 (page 1 only; page 2 keeps it)'] });
  }

  // SC-RED-03: a vector "signature" that the box covers in part. Its coordinates are the tokens.
  {
    const d = new Doc();
    const path = '0.1 0.1 0.5 RG 2 w 120 500 m 151.731 523.117 c 173.517 541.229 189.113 497.383 211.719 509.271 c 233.373 521.149 251.997 488.011 290 505 c S';
    d.page({
      content: [
        header('SC-RED-03', 'Redact part of a vector drawing', 'since 0.15.0 the whole curve goes, also the part outside the box; its coordinates 151.731 and 233.373 are gone from the saved file.'),
        path,
        box(140, 480, 80, 80, 'Redact this box'),
        textLines('Helv', 10, 120, 440, ['A drawn "signature": one curve, partly inside the box.']),
      ].join('\n'),
      resources: fonts,
    });
    out('SC-RED-03.pdf', d.finish(), { case: 'SC-RED-03', purpose: 'Redaction of a partly covered vector path', secrets: ['151.731 523.117', '233.373 521.149', '189.113 497.383'] });
  }

  // SC-RED-04: an image with a distinctive patch where the box is.
  {
    const d = new Doc();
    const W = 300;
    const H = 200;
    const px = Buffer.alloc(W * H * 3, 230);
    for (let y = 60; y < 140; y++)
      for (let x = 100; x < 200; x++) {
        const on = ((x >> 3) ^ (y >> 3)) & 1;
        const i = (y * W + x) * 3;
        px[i] = on ? 20 : 250;
        px[i + 1] = on ? 20 : 200;
        px[i + 2] = on ? 120 : 30;
      }
    const im = image(d.pdf, { width: W, height: H, data: px });
    d.page({
      content: [
        header('SC-RED-04', 'Redact part of an image', 'after Apply, the checker patch inside the box is cleared in the image itself: extract the image (pdfimages) and the patch is gone, the rest of the picture is not.'),
        'q 300 0 0 200 50 400 cm /Im Do Q',
        box(150, 460, 100, 80, 'Redact this box'),
      ].join('\n'),
      resources: resources({ fonts: BASE14, xobjects: { Im: im } }),
    });
    out('SC-RED-04.pdf', d.finish(), { case: 'SC-RED-04', purpose: 'Redaction of part of an image (check the extracted image)' });
  }

  // SC-RED-05: text in a Type 3 font whose glyphs are only used by the secret.
  {
    const d = new Doc();
    // Each glyph is a box with a distinctive inner mark; the 13.579… coordinates are the tokens.
    const glyph = (n) => ({ dict: '', data: `600 0 0 0 600 700 d1\n0 0 m 600 0 l 600 700 l 0 700 l h ${13.579 + n} ${24.681 + n} m 300 600 l 500 100 l h f` });
    const procs = ['S', 'E', 'C', 'R', 'T'].map((g, n) => [g, d.pdf.add(glyph(n))]);
    const t3 = d.pdf.add(
      `<< /Type /Font /Subtype /Type3 /FontBBox [0 0 600 700] /FontMatrix [0.001 0 0 0.001 0 0] /CharProcs << ${procs.map(([g, n]) => `/${g} ${n} 0 R`).join(' ')} >> /Encoding << /Type /Encoding /Differences [67 /C 69 /E 82 /R 83 /S 84 /T] >> /FirstChar 67 /LastChar 84 /Widths [600 0 600 ${Array(12).fill(0).join(' ')} 600 600 600] /Resources << >> >>`,
    );
    d.page({
      content: [
        header('SC-RED-05', 'Redact text in a Type 3 font', 'after Apply, the word drawn in the Type 3 font is gone, and the saved file no longer holds its glyph programs (search for 13.579).'),
        `BT /T3 24 Tf 60 560 Td ${str('SECRET')} Tj ET`,
        box(55, 550, 170, 34, 'Redact this box'),
        textLines('Helv', 12, 50, 500, ['GPCKEEP-T3-0001 stays.']),
      ].join('\n'),
      resources: resources({ fonts: { ...BASE14, T3: t3 } }),
    });
    out('SC-RED-05.pdf', d.finish(), { case: 'SC-RED-05', purpose: 'Redaction of text in a Type 3 font; unused glyph programs removed', secrets: ['13.579 24.681', '14.579 25.681', '15.579 26.681'], keep: ['GPCKEEP-T3-0001'] });
  }

  // SC-RED-06: material for Find text and redact, and for the built-in patterns.
  {
    const rand = rng(206);
    const d = new Doc();
    for (let p = 0; p < 3; p++) {
      d.page({
        content: [
          header('SC-RED-06', `Find text and redact, page ${p + 1} of 3`, 'searching GPCSECRET-FIND marks 6 places over 3 pages; the patterns find the e-mail addresses and phone numbers; after Apply none are left in the file.'),
          textLines('Times', 12, 50, 680, [
            ...wrap(enParagraph(rand, 2), 90),
            `Reference GPCSECRET-FIND-000${p * 2 + 1} appears here.`,
            `Contact: gpc.secret${p}@example.com, phone +1 202-555-01${80 + p}.`,
            ...wrap(enParagraph(rand, 2), 90),
            `And again: GPCSECRET-FIND-000${p * 2 + 2}, with a date 2026-10-0${p + 1}.`,
            'GPCKEEP-FIND-0001 is not part of the search.',
          ]),
        ].join('\n'),
        resources: fonts,
      });
    }
    out('SC-RED-06.pdf', d.finish(), {
      case: 'SC-RED-06',
      purpose: 'Search and redact across pages; e-mail and phone patterns',
      secrets: ['GPCSECRET-FIND', 'gpc.secret0@example.com', 'gpc.secret1@example.com', 'gpc.secret2@example.com', '202-555-0180'],
      keep: ['GPCKEEP-FIND-0001'],
    });
  }

  // SC-RED-07: fake redactions, a black box and a white box drawn over text that is still there.
  {
    const d = new Doc();
    d.page({
      content: [
        header('SC-RED-07', 'Fake redaction', 'the text under both boxes is still in the file; pdfcraft-cli audit must report this page, and copy-paste over the boxes reveals the text.'),
        textLines('Helv', 12, 50, 600, ['Salary: GPCSECRET-FAUX-0001 (under a black box)']),
        'q 0 g 95 594 210 18 re f Q',
        textLines('Helv', 12, 50, 550, ['Address: GPCSECRET-FAUX-0002 (under a white box)']),
        'q 1 g 0 G 0.3 w 102 544 220 18 re B Q',
      ].join('\n'),
      resources: fonts,
    });
    out('SC-RED-07.pdf', d.finish(), { case: 'SC-RED-07', purpose: 'Faux redaction: boxes drawn over text', secrets: ['GPCSECRET-FAUX-0001', 'GPCSECRET-FAUX-0002'] });
  }

  // SC-RED-08: a comment and a form field under the box, and a comment outside it.
  {
    const d = new Doc();
    const note = d.pdf.add('<< /Type /Annot /Subtype /Text /Rect [120 600 140 620] /Contents (GPCSECRET-ANNOT-0001) /T (Probe) /Name /Comment /C [1 0.8 0] >>');
    const keep = d.pdf.add('<< /Type /Annot /Subtype /Text /Rect [400 400 420 420] /Contents (GPCKEEP-ANNOT-0001) /T (Probe) /Name /Comment /C [0 0.6 1] >>');
    const field = d.pdf.add(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (secretfield) /V (GPCSECRET-FIELD-0001) /DA (/Helv 11 Tf 0 g) /Rect [160 560 360 580] /MK << /BC [0 0 0] >> /F 4 >>`);
    d.page({
      content: [
        header('SC-RED-08', 'Redact over a comment and a form field', 'after Apply, the note and the field inside the box are gone with their text; the blue note outside stays.'),
        box(110, 550, 260, 80, 'Redact this box'),
        textLines('Helv', 10, 380, 440, ['A note outside the box (keep)']),
      ].join('\n'),
      resources: fonts,
      annots: [note, field, keep],
    });
    out('SC-RED-08.pdf', d.finish({ catalog: ` /AcroForm << /Fields [${field} 0 R] /DA (/Helv 11 Tf 0 g) /DR << /Font << /Helv ${BASE14.Helv} >> >> /NeedAppearances true >>` }), {
      case: 'SC-RED-08',
      purpose: 'Redaction removes a comment and a form field under the mark',
      secrets: ['GPCSECRET-ANNOT-0001', 'GPCSECRET-FIELD-0001'],
      keep: ['GPCKEEP-ANNOT-0001'],
    });
  }

  // SC-SAN-01: hidden places a document can carry text.
  {
    const d = new Doc();
    const hiddenLayer = d.pdf.add('<< /Type /OCG /Name (Hidden layer) >>');
    const embedded = d.pdf.add({ dict: '/Type /EmbeddedFile /Subtype /text#2Fplain', data: 'Attached notes: GPCSECRET-ATTACH-0001\n' });
    const filespec = d.pdf.add(`<< /Type /Filespec /F (GPCSECRET-ATTACHNAME-0001.txt) /UF (GPCSECRET-ATTACHNAME-0001.txt) /EF << /F ${embedded} 0 R >> >>`);
    const xmp = d.pdf.add({
      dict: '/Type /Metadata /Subtype /XML',
      data: `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">GPCSECRET-XMP-0001</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`.replace(/\ufeff/, '\xef\xbb\xbf'),
    });
    const js = d.pdf.add('<< /S /JavaScript /JS (var probeNote = "GPCSECRET-JS-0001";) >>');
    const link = d.pdf.add('<< /Type /Annot /Subtype /Link /Rect [50 300 300 318] /Border [0 0 0] /A << /S /URI /URI (https://example.com/GPCSECRET-LINK-0001) >> >>');
    const pages = d.reservePages(1);
    const marks = outline(d.pdf, [{ title: 'GPCSECRET-BOOKMARK-0001', page: pages[0] }]);
    d.page({
      content: [
        header('SC-SAN-01', 'Sanitize document', 'after Sanitize and Save, scan-leaks finds none of the GPCSECRET tokens: info, XMP, attachment, hidden layer, invisible text, off-page text, script, bookmark, link and private data. GPCKEEP-BODY stays.'),
        textLines('Helv', 12, 50, 650, ['GPCKEEP-BODY-0001: the visible body text stays.']),
        `/OC /Hid BDC\n${textLines('Helv', 12, 50, 620, ['GPCSECRET-OCG-0001 in a layer that is off'])}\nEMC`,
        `BT 3 Tr /Helv 12 Tf 50 590 Td ${str('GPCSECRET-INVISIBLE-0001')} Tj ET`,
        `BT /Helv 12 Tf -800 590 Td ${str('GPCSECRET-OFFPAGE-0001')} Tj ET`,
        textLines('Helv', 12, 50, 305, ['A link (its address holds a token)']),
      ].join('\n'),
      resources: resources({ fonts: BASE14, properties: { Hid: hiddenLayer } }),
      annots: [link],
      extra: ' /PieceInfo << /GetPdfCraftProbe << /LastModified (D:20261102000000Z) /Private (GPCSECRET-PIECE-0001) >> >>',
    });
    const info = `<< /Title (GPCSECRET-INFO-TITLE) /Author (GPCSECRET-INFO-AUTHOR) /Subject (GPCSECRET-INFO-SUBJECT) /Keywords (GPCSECRET-INFO-KEYWORDS) /Producer (GetPdfCraft test corpus) >>`;
    out(
      'SC-SAN-01.pdf',
      d.finish({
        info,
        catalog: ` /Metadata ${xmp} 0 R /Outlines ${marks} 0 R /OpenAction ${js} 0 R /Names << /EmbeddedFiles << /Names [(GPCSECRET-ATTACHNAME-0001.txt) ${filespec} 0 R] >> >> /OCProperties << /OCGs [${hiddenLayer} 0 R] /D << /OFF [${hiddenLayer} 0 R] >> >>`,
      }),
      {
        case: 'SC-SAN-01',
        purpose: 'Sanitize: metadata, XMP, attachment, hidden layer, invisible and off-page text, script, bookmark, link, private data',
        secrets: ['GPCSECRET-'],
        keep: ['GPCKEEP-BODY-0001'],
      },
    );
  }

  // SC-INC-01: what an ordinary save keeps. Page 1 has a line to edit, page 2 is to be deleted.
  {
    const rand = rng(211);
    const d = new Doc();
    d.page({
      content: [header('SC-INC-01', 'Edit, then Save and Save As', 'edit the line with GPCSECRET-EDIT-0001 to say something else; see README for what each save should keep.'), textLines('Helv', 14, 50, 650, ['Old wording: GPCSECRET-EDIT-0001']), textLines('Times', 12, 50, 600, wrap(enParagraph(rand, 4), 90))].join('\n'),
      resources: fonts,
    });
    d.page({ content: [header('SC-INC-01', 'page 2, to be deleted', 'after deleting this page and saving (0.17.0 and later), GPCSECRET-PAGE2-0001 is gone from the file.'), textLines('Helv', 14, 50, 650, ['Page two secret: GPCSECRET-PAGE2-0001'])].join('\n'), resources: fonts });
    d.page({ content: [header('SC-INC-01', 'page 3', 'stays.'), textLines('Helv', 14, 50, 650, ['GPCKEEP-PAGE3-0001'])].join('\n'), resources: fonts });
    out('SC-INC-01.pdf', d.finish(), { case: 'SC-INC-01 SC-INC-02', purpose: 'What Save and Save As keep after editing text and deleting a page', secrets: ['GPCSECRET-EDIT-0001', 'GPCSECRET-PAGE2-0001'], keep: ['GPCKEEP-PAGE3-0001'] });
  }

  // SC-JS-01: links and scripts that try to leave the document.
  {
    const d = new Doc();
    const rows = [
      ['Web link (URI): should ask first', '<< /S /URI /URI (https://example.com/getpdfcraft-uri) >>'],
      ['E-mail link (mailto): should ask first', '<< /S /URI /URI (mailto:probe@example.com?subject=getpdfcraft) >>'],
      ['file: link: should be refused', '<< /S /URI /URI (file:///etc/hosts) >>'],
      ['Launch a program (Mac): should be refused', '<< /S /Launch /F (/System/Applications/Calculator.app) >>'],
      ['Launch a program (Windows): should be refused', '<< /S /Launch /Win << /F (C:\\\\Windows\\\\System32\\\\calc.exe) >> >>'],
      ['Script app.launchURL: should ask first', '<< /S /JavaScript /JS (app.launchURL\\("https://example.com/getpdfcraft-js", true\\);) >>'],
      ['Script app.alert with a title and Yes/No buttons', '<< /S /JavaScript /JS (app.alert\\({cMsg: "GetPdfCraft probe message", cTitle: "Probe title", nIcon: 2, nType: 2}\\);) >>'],
      ['Script submitForm to a web address: should not send silently', '<< /S /JavaScript /JS (this.submitForm\\({cURL: "https://example.com/getpdfcraft-submit", cSubmitAs: "HTML"}\\);) >>'],
      ['Script endless loop: PdfCraft must stay responsive', '<< /S /JavaScript /JS (for \\(;;\\) {}) >>'],
    ];
    const annots = rows.map(([, action], i) => d.pdf.add(`<< /Type /Annot /Subtype /Link /Rect [50 ${640 - i * 40} 450 ${662 - i * 40}] /Border [0 0 1] /C [0 0 1] /A ${action} >>`));
    d.page({
      content: [header('SC-JS-01', 'Links and scripts', 'click each box. Web and e-mail addresses ask before opening; file: addresses and programs are refused with a notice; the loop does not freeze the app; nothing is sent without asking.'), ...rows.map(([label], i) => textLines('Helv', 12, 55, 646 - i * 40, [`${i + 1}. ${label}`]))].join('\n'),
      resources: fonts,
      annots,
    });
    out('SC-JS-01.pdf', d.finish(), { case: 'SC-JS-01 SC-JS-02', purpose: 'URI, mailto, file:, Launch and JavaScript actions' });
  }

  // SC-ENC-SRC: the plain document the encrypted variants are made from (tools/make-corpus.mjs runs qpdf).
  {
    const rand = rng(221);
    const d = new Doc();
    d.page({ content: [header('SC-ENC', 'Encrypted variants', 'opens with the password in corpus/README.md; this text appears unchanged.'), textLines('Helv', 14, 50, 650, ['GPCENC-PLAIN-0001: readable only after the password.']), textLines('Times', 12, 50, 600, wrap(enParagraph(rand, 4), 90))].join('\n'), resources: fonts });
    d.page({ content: textLines('Helv', 14, 50, 650, ['Page 2 of the encrypted probe.']), resources: fonts });
    out('SC-ENC-SRC.pdf', d.finish({ info: `<< /Title ${textString('Encrypted probe')} >>` }), { case: 'SC-ENC-01', purpose: 'Source of the qpdf-encrypted variants', secrets: ['GPCENC-PLAIN-0001 (must not appear in encrypted files)'] });
  }
}
