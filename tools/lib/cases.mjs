// Reads the case tables in suites/*.md, which are the list of cases.
// A row is a case when its first cell is an ID such as SC-RED-02, or a range such as RD-REAL-01~06.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const SUITES = {
  rd: { file: 'rd-rendering.md', name: '显示和阅读' },
  or: { file: 'or-organize.md', name: '页面整理、合并和拆分' },
  an: { file: 'an-comments.md', name: '注释' },
  fm: { file: 'fm-forms.md', name: '表单和签名' },
  sc: { file: 'sc-security.md', name: '加密、密文和清理' },
  cv: { file: 'cv-convert.md', name: '创建、转换和 OCR' },
  mc: { file: 'mc-mcp-cli.md', name: 'MCP 和命令行' },
  in: { file: 'in-install.md', name: '下载、安装和网络' },
  pf: { file: 'pf-performance.md', name: '性能' },
  st: { file: 'st-stability.md', name: '稳定性和数据安全' },
};

export const VERDICTS = ['pass', 'minor', 'major', 'fail', 'na', 'blocked', 'skip'];
export const FLAGS = ['dataLoss', 'leak', 'crash', 'repair', 'warning'];
export const STAGES = ['O', 'D', 'E', 'S', 'R', 'A', 'V', 'X', 'T', 'M'];

const ID = /^([A-Z]{2}(?:-[A-Z0-9]+)+)(?:~(\d+))?$/;

export async function loadCases(suitesDir) {
  const cases = [];
  for (const [suite, { file }] of Object.entries(SUITES)) {
    const text = await readFile(join(suitesDir, file), 'utf8');
    for (const line of text.split('\n')) {
      if (!line.startsWith('|')) continue;
      const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((s) => s.trim().replace(/\\\|/g, '|'));
      if (cells.length < 7) continue;
      const m = ID.exec(cells[0]);
      if (!m) continue;
      const [, priority, systems, stages, source, title, how] = cells;
      const base = {
        suite,
        priority,
        systems: systems.split(/\s+/).map((s) => s.toLowerCase()),
        stages: stages.split(/\s+/).filter(Boolean),
        source,
        title,
        how,
      };
      if (m[2]) {
        const [, prefix, start] = /^(.*-)(\d+)$/.exec(m[1]);
        for (let n = Number(start); n <= Number(m[2]); n++) cases.push({ ...base, id: `${prefix}${String(n).padStart(start.length, '0')}` });
      } else {
        cases.push({ ...base, id: m[1] });
      }
    }
  }
  const seen = new Set();
  for (const c of cases) {
    if (seen.has(c.id)) throw new Error(`duplicate case ${c.id}`);
    seen.add(c.id);
    for (const s of c.stages) if (!STAGES.includes(s)) throw new Error(`${c.id}: unknown stage ${s}`);
    if (!/^P[0-2]$/.test(c.priority)) throw new Error(`${c.id}: priority "${c.priority}"`);
  }
  return cases;
}

const BATCH = /^`([a-z]+\d*)`$/;
const CASE_ID = /^[A-Z]{2}(?:-[A-Z0-9]+)+$/;

/**
 * Reads the batch tables in batches.md: a row is a batch when its first cell is an id in backticks,
 * such as `sc1`, and its third cell lists the case ids.
 */
export async function loadBatches(file) {
  const batches = new Map();
  for (const line of (await readFile(file, 'utf8')).split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((s) => s.trim());
    const m = BATCH.exec(cells[0] ?? '');
    if (!m) continue;
    if (batches.has(m[1])) throw new Error(`batch ${m[1]} is defined twice`);
    const ids = (cells[2] ?? '').split(/\s+/).filter((s) => CASE_ID.test(s));
    batches.set(m[1], { id: m[1], title: cells[1], cases: ids });
  }
  return batches;
}

/** The unit a PF measurement is recorded in. */
export const unitOf = (id) => (/^PF-(SIZE|MEM)/.test(id) ? 'MB' : 's');
