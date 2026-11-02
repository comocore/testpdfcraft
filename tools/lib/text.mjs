// Seeded filler text in English and Chinese.
// It is generated rather than quoted, so the test files contain no third-party text.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n) => (n.endsWith('y') ? `${n.slice(0, -1)}ies` : n.endsWith('x') ? `${n}es` : `${n}s`);

const EN = {
  adj: ['clear', 'simple', 'careful', 'small', 'large', 'separate', 'previous', 'following', 'short', 'detailed',
    'familiar', 'useful', 'common', 'independent', 'visible', 'hidden', 'printed', 'shared', 'complete', 'partial',
    'original', 'modified', 'typical', 'consistent', 'different', 'standard', 'optional', 'important', 'narrow', 'wide'],
  noun: ['document', 'paragraph', 'table', 'heading', 'chapter', 'page', 'section', 'reader', 'editor', 'margin',
    'column', 'picture', 'caption', 'footnote', 'reference', 'template', 'style', 'list', 'report', 'letter',
    'draft', 'version', 'comment', 'change', 'reviewer', 'author', 'format', 'layout', 'line', 'word',
    'sentence', 'border', 'header', 'footer', 'field', 'number', 'index', 'outline', 'summary', 'figure'],
  verb: ['describe', 'contain', 'follow', 'change', 'keep', 'move', 'show', 'explain', 'record', 'repeat',
    'replace', 'check', 'list', 'mark', 'open', 'save', 'print', 'compare', 'split', 'join'],
  adv: ['quickly', 'carefully', 'usually', 'often', 'rarely', 'again', 'later', 'already', 'still', 'simply',
    'exactly', 'almost', 'clearly'],
  prep: ['in', 'on', 'after', 'before', 'under', 'above', 'between', 'inside', 'across', 'near', 'without', 'through'],
  long: ['internationalization', 'responsibilities', 'characteristically', 'interoperability', 'representative',
    'administration', 'straightforward', 'notwithstanding', 'troubleshooting', 'acknowledgement',
    'correspondingly', 'comprehensively'],
  conn: ['However,', 'In practice,', 'For example,', 'At the same time,', 'As a rule,', 'In most cases,',
    'Before that,', 'After that,', 'Even so,'],
};

const EN_TEMPLATES = [
  'The {adj} {noun} {verbs} the {noun} {prep} the {adj} {noun}.',
  '{conn} each {noun} {verbs} {num} {nouns} {prep} a {adj} {noun}.',
  'A {noun} {prep} the {noun} {adv} {verbs} its own {noun}.',
  '{Nouns} {verb} {adv} when the {noun} {verbs} a {long} {noun}.',
  'Every {adj} {noun} {verbs} the {noun}, and the {noun} {verbs} {num} {adj} {nouns}.',
  'The {noun} {adv} {verbs} the {long} of the {adj} {noun}.',
  '{conn} the {nouns} {prep} the {noun} {verb} the {adj} {noun} on page {num}.',
];

export function enSentence(rand) {
  const s = pick(rand, EN_TEMPLATES).replace(/\{(\w+)\}/g, (_, k) => {
    switch (k) {
      case 'verbs': return `${pick(rand, EN.verb)}s`.replace(/hs$/, 'hes').replace(/ys$/, 'ies');
      case 'nouns': return plural(pick(rand, EN.noun));
      case 'Nouns': return cap(plural(pick(rand, EN.noun)));
      case 'num': return String(2 + Math.floor(rand() * 40));
      default: return pick(rand, EN[k]);
    }
  });
  return cap(s.replace(/\ba ([aeiou])/g, 'an $1'));
}

export function enParagraph(rand, sentences = 4 + Math.floor(rand() * 4)) {
  return Array.from({ length: sentences }, () => enSentence(rand)).join(' ');
}

/** About `count` words of English, split into paragraphs. */
export function enParagraphs(rand, count) {
  const out = [];
  let words = 0;
  while (words < count) {
    const para = enParagraph(rand);
    out.push(para);
    words += para.split(' ').length;
  }
  return out;
}

export function enTitle(rand) {
  return `${cap(pick(rand, EN.adj))} ${plural(pick(rand, EN.noun))} and ${plural(pick(rand, EN.noun))}`;
}

const ZH = {
  lead: ['首先，', '其次，', '此外，', '在实际工作中，', '一般来说，', '如果时间允许，', '为了便于核对，', '同时，', '', '', ''],
  subj: ['这份文档', '每个段落', '新的版本', '编辑人员', '审阅者', '这张表格', '目录', '页眉和页脚', '正文', '附件',
    '本章', '测试文件', '文字处理软件', '排版规则', '标题样式', '项目负责人', '各有关单位', '课题组'],
  verb: ['需要', '可以', '应当', '通常会', '在保存时', '在打开后', '按照要求', '必须'],
  act: ['统一调整格式', '保留原有的编号', '重新计算页码', '检查标点的位置', '更新目录中的页码', '对齐表格中的数字',
    '设置首行缩进两个字符', '标出修改过的内容', '保持每页的行数不变', '避免在行首出现句号', '把图片放在正文中间',
    '按章节分别编号', '核对引用的文献', '记录每一处差异', '和原文件逐页对比', '使用规定的字体和字号',
    '在页面底部居中显示页码', '把表格的标题行设为重复'],
  extra: ['（见第 {n} 页）', '，共 {n} 处', '，约占 {n}%', '，涉及 DOCX 和 PDF 两种格式', '，在 Word 中打开时也一样',
    '，例如 2026 年第 {n} 期', '', '', '', ''],
  tail: ['，以便读者阅读', '，这样打印出来更加整齐', '，否则容易出现错位', '，并在备注里写明原因',
    '，然后再交给下一位同事', '，保证前后格式一致', '', ''],
  end: ['。', '。', '。', '；', '？'],
};

export function zhSentence(rand) {
  const extra = pick(rand, ZH.extra).replace('{n}', String(1 + Math.floor(rand() * 60)));
  let s = pick(rand, ZH.lead) + pick(rand, ZH.subj) + pick(rand, ZH.verb) + pick(rand, ZH.act) + extra + pick(rand, ZH.tail);
  if (rand() < 0.12) s += `，即所谓“${pick(rand, ZH.act)}”`;
  return s + pick(rand, ZH.end);
}

export function zhParagraph(rand, sentences = 3 + Math.floor(rand() * 4)) {
  let p = Array.from({ length: sentences }, () => zhSentence(rand)).join('');
  if (/[；？]$/.test(p)) p = `${p.slice(0, -1)}。`;
  return p;
}

/** About `count` Chinese characters, split into paragraphs. */
export function zhParagraphs(rand, count) {
  const out = [];
  let chars = 0;
  while (chars < count) {
    const para = zhParagraph(rand);
    out.push(para);
    chars += para.length;
  }
  return out;
}

const HANZI =
  '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经' +
  '十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相' +
  '全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系很情者最立代想已通并提直题程展五果料象';

/** `n` Chinese characters without punctuation, for lines of an exact length. */
export function hanzi(rand, n) {
  let s = '';
  for (let i = 0; i < n; i++) s += HANZI[Math.floor(rand() * HANZI.length)];
  return s;
}
