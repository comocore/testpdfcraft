#!/usr/bin/env node
// Creates the record files for one test run: runs/<date>-<os>-<version>[-<batch>]/.
//
//   node tools/new-run.mjs --os mac --version 0.17.0 --batch sc2 --from runs/2026-11-03-mac-0.17.0-sc1
//   node tools/new-run.mjs --os mac --version 0.18.0 --batch reg --add SC-RED-03,RD-TXT-02
//   node tools/new-run.mjs --os win --version 0.17.0 --priority P0 --suites rd,sc
//
// --batch lists the cases of one batch in batches.md (and ignores --priority and --suites);
// --add puts more cases into it. --from copies the machine, reference and font details from an earlier run.
// Without --batch, --priority P0 lists only P0 cases, P1 lists P0 and P1, and the default lists all.

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseDocument } from 'yaml';
import { SUITES, loadBatches, loadCases, unitOf } from './lib/cases.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const os = arg('os');
const version = arg('version');
if (!['mac', 'win'].includes(os) || !version) {
  console.error(
    'usage: new-run.mjs --os mac|win --version <PdfCraft version> [--batch <id> [--add ID,...]] [--from <earlier run>] [--date YYYY-MM-DD] [--priority P0|P1|P2] [--suites rd,sc,...]',
  );
  process.exit(2);
}
const date = arg('date', new Date().toISOString().slice(0, 10));
const maxPriority = Number(arg('priority', 'P2').slice(1));
const batchId = arg('batch');
const batch = batchId && (await loadBatches(join(root, 'batches.md'))).get(batchId);
if (batchId && !batch) {
  console.error(`no batch "${batchId}" in batches.md`);
  process.exit(2);
}
const added = arg('add', '').split(',').filter(Boolean);
const from = arg('from');
const prev = from && parse(await readFile(join(from, 'run.yaml'), 'utf8'));
const suites = batch ? Object.keys(SUITES) : arg('suites', Object.keys(SUITES).join(',')).split(',');
const runId = `${date}-${os}-${version}${batch ? `-${batch.id}` : ''}`;
const dir = join(root, 'runs', runId);

try {
  await access(dir);
  console.error(`${dir} already exists`);
  process.exit(1);
} catch {}

const q = (s) => JSON.stringify(s ?? '');
const all = await loadCases(join(root, 'suites'));
for (const id of added) {
  if (!all.some((c) => c.id === id)) {
    console.error(`--add: no case ${id} in suites`);
    process.exit(2);
  }
}
// Every batch that uses PdfCraft also keeps the crash log of ST-LOG-01.
const inBatch = batch && new Set([...batch.cases, ...added, ...(batch.cases.length ? ['ST-LOG-01'] : [])]);
const cases = all.filter((c) =>
  c.systems.includes(os) && (inBatch ? inBatch.has(c.id) : suites.includes(c.suite) && Number(c.priority.slice(1)) <= maxPriority),
);

await mkdir(join(dir, 'evidence'), { recursive: true });
await mkdir(join(dir, 'outputs'), { recursive: true });
await mkdir(join(dir, 'logs'), { recursive: true });

const template = `# 本轮测试的环境。开始前填好，中途有变化记在 changes 里。说明见 runs/README.md。
run: ${runId}
batch: ${batch ? batch.id : '""'}
started: ${date}
finished:
tester: ""              # 内部代号；页面上只写 GetPdfCraft editors
machine:
  os: ""                # 例：macOS 26.6.2 (25G83)；Windows 11 Pro 24H2 (26100.4061)
  model: ""             # 例：Mac mini (M4, 2024)
  cpu: ""
  memory_gb:
  gpu: ""
  display: ""           # 分辨率和缩放，例：3840×2160，缩放 200%
  system_language: ""
  region: ""
  input_methods: []
  power: ""             # 例：接电源，低电量模式关
pdfcraft:
  version: ${version}
  installer: ""         # 文件名
  installer_sha256: ""
  cli: ""
  cli_sha256: ""
  install_path: ""
  process_name: ""      # 活动监视器或任务管理器里显示的名称
  ui_language: ""
  settings: fresh       # fresh：开始前设置和恢复目录是空的
reference:
  acrobat_reader: ""    # 例：Adobe Acrobat Reader 2026.002.xxxxx（"帮助 › 关于"里的版本）
  preview: ""           # 例：macOS 预览 11.0；Windows 上留空
  others: []            # 例：["Microsoft Word 16.93", "WPS Office 12.1"]
fonts:
  chinese_installed: [] # 系统里装的中文字体，例：["宋体-简", "华文黑体", "苹方"]
  extra_installed: []   # 为测试另装的字体：应该为空
tools: []               # 例：["qpdf 12.2.0", "poppler 26.10.0", "LuLu 3.1.5"]
changes: []             # 例：["2026-10-22 macOS 自动更新到 26.6.3"]
`;

// --from: the machine doesn't change between batches, so start from what the last run recorded.
// The installer and its checksum carry over only when the version is the same.
let runYaml = template;
if (prev) {
  const doc = parseDocument(template);
  const keep = [['tester'], ['machine'], ['reference'], ['fonts'], ['tools'], ['pdfcraft', 'install_path'], ['pdfcraft', 'process_name'], ['pdfcraft', 'ui_language']];
  if (prev.pdfcraft?.version === version) keep.push(['pdfcraft', 'installer'], ['pdfcraft', 'installer_sha256'], ['pdfcraft', 'cli'], ['pdfcraft', 'cli_sha256']);
  for (const path of keep) {
    const value = path.reduce((o, k) => o?.[k], prev);
    if (value !== undefined && value !== null) doc.setIn(path, value);
  }
  runYaml = doc.toString();
}
await writeFile(join(dir, 'run.yaml'), runYaml);

for (const suite of suites) {
  const list = cases.filter((c) => c.suite === suite);
  if (!list.length) continue;
  const lines = [
    `# ${suite.toUpperCase()}：${SUITES[suite].name} · ${runId}`,
    `# 用例和步骤见 suites/${SUITES[suite].file}；等级、标记和证据的规则见 README.md §5–§6。`,
    '# 等级：pass minor major fail na blocked skip    标记：dataLoss leak crash repair warning',
    `suite: ${suite}`,
    'cases:',
  ];
  for (const c of list) {
    lines.push(`  - id: ${c.id}`, `    p: ${c.priority}`, `    title: ${q(c.title)}`);
    if (suite === 'pf') {
      lines.push(`    unit: ${q(unitOf(c.id))}`, '    pdfcraft: []', '    acrobat: []', '    other: []', '    other_app: ""', '    M:');
    } else {
      for (const s of c.stages) lines.push(`    ${s}:`);
    }
    if (c.id === 'ST-LOG-01') lines.push('    events: []    # - { time: "2026-11-03 14:05", case: SC-RED-03, action: "", log: logs/… }');
    if (c.suite === 'sc' && c.stages.includes('V')) lines.push('    scan: ""      # tools/scan-leaks.mjs 的输出文件，放在 evidence/');
    lines.push('    flags: []', '    note: ""', '    evidence: []', '    issue: ""', '    checked:');
  }
  await writeFile(join(dir, `${suite}.yaml`), `${lines.join('\n')}\n`);
  console.log(`${suite}.yaml  ${list.length} cases`);
}
console.log(`→ ${dir}`);
