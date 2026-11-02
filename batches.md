# 分批计划

> 方案 1.0 · 2026-11-02。每一批在一台机器上做，尽量不超过 1 小时；测完一批，就把这一批的结果写进页面上线。

## 每一批怎么做

每批的用时里都包含约 10 分钟的固定部分：

1. **开始（约 3 分钟）**：确认装的是不是最新的正式版（§版本），运行 `node tools/new-run.mjs --os mac --version <版本> --batch <批次> --from <上一批的目录>`。`--from` 会把上一批 `run.yaml` 里的机器、参考软件和字体信息带过来，只要核对有没有变。把 PdfCraft 的设置和恢复文件夹改个名，让它以默认设置启动。
2. **复判（约 4 分钟）**：上一批结束时抽到的用例，不看原记录，重新判定，写进上一批记录的 `recheck`（README.md §5.5）。第一批没有这一步。
3. **测试（约 45–50 分钟）**：按下表的用例做。测试文件都从 `corpus/` 复制到本批的 `work/` 里再用，原件不动。
4. **收尾（约 3 分钟）**：`node tools/check-run.mjs <本批目录> --sample 10`，修掉所有 error，记下抽到的复判用例，提交。

做不完就停在用例之间，没做的留空，下一批先补上。不要为了赶时间降低标准：拿不准仍然选更差的一级。每一批都自动带上 ST-LOG-01（崩溃记录）。

### 版本

每一批开始时用当时最新的正式版，一批之内不换版本。上一批之后有了新版本，就先装新版本（下载、核对 SHA-256，约 5 分钟，算在这一批里），这一批的结果记在新版本上。已经测过的批次不因为新版本重测，由回归批（`reg`）跟进。

### 上线

- 测完一批后 1–2 天内上线：编辑把记录写进"测完上线"一栏的页面，过 content-gate，核对页面和记录一致，部署。
- 第一次出现的页面（`/tests`、`/tests/redaction`、`/tests/rendering`、`/tests/editing`、`/tests/performance`），第一批就要能单独回答一个读者的问题，下表的顺序是按这个排的。
- 页面写明"计划 M 个用例，已测 N 个"，没测的列为"未测"。每个结果标出测试时的 PdfCraft 版本。
- `leak` 结果在上游发布修复之前，页面只写"发现一个问题，已私下报告给开发者"（README §9、§10）。
- 中英文都出的页面，两种语言同一次更新。

## 第 1 轮：P0（每台机器 14 批）

Mac 先做，Windows 再按同样的批次做一遍。只在一个系统上测的用例（比如 IN-SIG-01 只在 Mac），`new-run.mjs` 会按系统挑出来。用时是 Mac 上的估计，第一批做完后按实际改。

| 批次 | 内容 | 用例 | Mac 用时 | 测完上线 |
|---|---|---|---|---|
| `prep` | 准备：测试用户、qpdf 和 poppler、生成测试文件、用 Acrobat Reader 核对探针、按 recipes.md 做文件和测试证书、下载 R 类文件 | — | 约 55 分钟 | 不上线 |
| `in1` | 下载、签名、安装、首次启动和网络 | IN-DL-01 IN-SIG-01 IN-SIG-02 IN-INS-01 IN-INS-02 IN-1ST-01 IN-NET-01 | 约 50 分钟 | 新页面 `/tests`（方法、机器、进度）；`/download/macos`、`/download/windows` 换成实际看到的步骤；`/safety` 加上签名和网络连接的实测 |
| `sc1` | 密文：文字、共享块、矢量、图片、假密文 | SC-RED-01 SC-RED-02 SC-RED-03 SC-RED-04 SC-RED-07 | 约 55 分钟 | 新页面 `/tests/redaction` |
| `sc2` | 查找密文、清理文档、保存会留下什么 | SC-RED-06 SC-SAN-01 SC-INC-01 SC-INC-02 | 约 50 分钟 | `/tests/redaction`；`/safety` 的"保存"和"密文"两条加上实测 |
| `sc3` | 加密和脚本、链接 | SC-ENC-01 SC-ENC-02 SC-JS-01 | 约 45 分钟 | `/safety` 的加密、脚本和链接加上实测 |
| `rd1` | 中文、阅读顺序、书签和链接 | RD-TXT-02 RD-FIND-01 RD-NAV-01 | 约 45 分钟 | 新页面 `/tests/rendering`（中文版以中文 PDF 的结果开头） |
| `rd2` | 图形和三份真实文档 | RD-GFX-01 RD-REAL-01 RD-REAL-02 RD-REAL-04 | 约 55 分钟 | `/tests/rendering` |
| `or1` | 旋转、删除、插入、提取、合并 | OR-ROT-01 OR-DEL-01 OR-INS-01 OR-EXT-01 OR-CMB-01 | 约 55 分钟 | 新页面 `/tests/editing` |
| `an1` | 注释和填写与签名 | AN-ADD-01 AN-THR-01 AN-RD-01 FM-FS-01 | 约 50 分钟 | `/tests/editing` |
| `fm1` | 表单和数字签名 | FM-FILL-01 FM-FILL-02 FM-MAKE-01 FM-SIG-01 | 约 55 分钟 | `/tests/editing`；`/compare/adobe-acrobat` 的表单和签名加上实测 |
| `cv1` | 创建、导出 Word、OCR、压缩 | CV-IMG-01 CV-DOCX-01 CV-OCR-01 CV-OCR-03 CV-OPT-01 | 约 55 分钟 | `/tests/editing`；`/compare/adobe-acrobat` 的转换和 OCR 加上实测 |
| `mc1` | 命令行、Claude Code 接入和文件夹限制、控制通道 | MC-CLI-01 MC-CLI-02 MC-MCP-01 MC-MCP-02 MC-CTL-01 | 约 55 分钟 | 改写 `/mcp` |
| `st1` | 坏文件、磁盘满、保存时强制退出、崩溃后恢复 | ST-BAD-01 ST-BAD-02 ST-SAV-01 ST-SAV-02 ST-REC-01 | 约 55 分钟 | `/safety` 加"会不会丢文件"；`/tests` |
| `pf1` | 启动、内存、打开大文件 | PF-START-01 PF-MEM-01 PF-OPEN-01 PF-OPEN-02 | 约 50 分钟 | 新页面 `/tests/performance` |

## 第 1 轮：P1（每台机器 15 批）

| 批次 | 内容 | 用例 | Mac 用时 | 测完上线 |
|---|---|---|---|---|
| `rd3` | 字体、竖排、日韩文字 | RD-TXT-01 RD-TXT-03 RD-TXT-04 RD-ZOOM-01 | 约 45 分钟 | `/tests/rendering` |
| `rd4` | 图形、图片、图层、视图 | RD-GFX-02 RD-GFX-03 RD-IMG-01 RD-OCG-01 RD-NAV-02 | 约 50 分钟 | `/tests/rendering` |
| `rd5` | 中文报告、扫描件、工程图 | RD-REAL-03 RD-REAL-05 RD-REAL-06 | 约 45 分钟 | `/tests/rendering` |
| `or2` | 拆分、合并的特殊情况、页码标签 | OR-SPL-01 OR-CMB-02 OR-CMB-03 OR-LBL-01 | 约 50 分钟 | `/tests/editing` |
| `or3` | 裁剪、页眉页脚水印、缩略图 | OR-CRP-01 OR-HF-01 OR-THUMB-01 | 约 45 分钟 | `/tests/editing` |
| `an2` | 中文注释、旋转页、导入导出、拼合、移动 | AN-CJK-01 AN-ROT-01 AN-IMP-01 AN-EXP-01 AN-FLAT-01 AN-MOVE-01 | 约 55 分钟 | `/tests/editing` |
| `fm2` | 表单脚本、识别字段、数据、拼合 | FM-JS-01 FM-JS-02 FM-DET-01 FM-DATA-01 FM-FLAT-01 | 约 50 分钟 | `/tests/editing` |
| `fm3` | 签名的验证、修改和认证 | FM-SIG-02 FM-SIG-03 FM-SIG-04 | 约 45 分钟 | `/tests/editing` |
| `sc4` | 更多密文、删除隐藏信息、签名文件 | SC-RED-05 SC-RED-08 SC-RED-09 SC-HID-01 SC-INC-03 | 约 55 分钟 | `/tests/redaction` |
| `sc5` | 加密文件编辑、权限、死循环、日志 | SC-ENC-03 SC-PERM-01 SC-JS-02 SC-LOG-01 | 约 45 分钟 | `/safety` |
| `cv2` | 创建和导出的其他格式、带重音的 OCR | CV-IMG-02 CV-TXT-01 CV-DOCX-02 CV-PPTX-01 CV-EXP-01 CV-OCR-02 | 约 55 分钟 | `/tests/editing`；`/compare/adobe-acrobat` |
| `mc2` | edit、批处理、脚本、MCP 细节 | MC-CLI-03 MC-CLI-04 MC-CLI-05 MC-MCP-03 MC-MCP-04 MC-MCP-05 | 约 55 分钟 | `/mcp` |
| `in2` | 为所有人安装、便携版、断网、更新、卸载 | IN-INS-03 IN-INS-04 IN-NET-02 IN-UPD-01 IN-UNI-01 | 约 55 分钟 | 下载页、`/safety` |
| `pf2` | 大文件内存、保存、合并、命令行、占用空间 | PF-OPEN-03 PF-MEM-02 PF-SAVE-01 PF-CMB-01 PF-CLI-01 PF-SIZE-01 | 约 55 分钟 | `/tests/performance` |
| `st2` | 坏文件和保存的特殊情况 | ST-BAD-03 ST-BAD-04 ST-BAD-05 ST-BAD-06 ST-BAD-07 ST-SAV-03 ST-SAV-04 ST-SAV-05 | 约 50 分钟 | `/safety`；`/tests` |

P2 用例（RD-HIDPI-01 RD-PDF2-01 RD-WEB-01 AN-SUM-01 FM-XFA-01 CV-OPT-02 CV-PDFA-01 MC-CTL-02 IN-INS-05 IN-WEB-01 ST-BAD-08）不排批次，有时间或读者问到时用 `--add` 加进某一批。

## 回归

| 批次 | 内容 | 用例 | Mac 用时 | 测完上线 |
|---|---|---|---|---|
| `reg` | 每个新版本发布后三天内的核心回归（README §8） | RD-TXT-02 RD-REAL-01 SC-RED-01 SC-INC-02 FM-FILL-01 | 约 50 分钟 | 该版本的发布说明页加"实测变化"；测试页标出复测过的版本 |
