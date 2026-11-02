# PdfCraft 实测方案

Hands-on tests of [PdfCraft](https://github.com/storytold/pdfcraft), the open-source PDF reader and editor, with Adobe Acrobat Reader and macOS Preview on the same machine as references: the method, the cases, the test file generator, a leak scanner for redaction and saving, and the raw records behind the test pages on [getpdfcraft.org](https://getpdfcraft.org). The method is written in Chinese; case IDs, file names and record fields are the same on every page. GetPdfCraft is an independent site, not affiliated with ArtCraft or Adobe.

这里是 [getpdfcraft.org](https://getpdfcraft.org) 测试页面背后的方法、用例、测试文件生成脚本、泄漏检查工具和原始记录。GetPdfCraft 是独立网站，和 ArtCraft、Adobe 都没有关系。许可见 [corpus/README.md](corpus/README.md#公开和许可)。

> 版本 1.0 · 2026-11-02 · 适用于 PdfCraft 0.17.0 及以后
>
> 本方案和全部用例在开始测试之前提交。之后的修改记在文末的"修订记录"里，测试页面会链接到这里，读者可以看到我们有没有在测完之后改标准。

## 1. 要回答的问题

| 读者的问题 | 套件 |
|---|---|
| 别人发来的 PDF 能不能正常显示？中文 PDF 会不会一片空白？找得到、复制得对吗？ | [RD：显示和阅读](suites/rd-rendering.md) |
| 合并、拆分、调整页面之后，书签、链接、表单还在不在？ | [OR：页面整理、合并和拆分](suites/or-organize.md) |
| 批注别人能不能看到？Acrobat 里加的批注 PdfCraft 认不认？ | [AN：注释](suites/an-comments.md) |
| 表单能不能填、存了以后 Acrobat 里还对吗？签名有效吗？ | [FM：表单和签名](suites/fm-forms.md) |
| 密文处理是不是真的删掉了？保存后文件里还藏着什么？加密可靠吗？PDF 里的脚本和链接会不会乱来？ | [SC：加密、密文和清理](suites/sc-security.md) |
| 图片能不能做成 PDF？导出 Word 能用吗？OCR 认不认中文？压缩能压多少？ | [CV：创建、转换和 OCR](suites/cv-convert.md) |
| 命令行和 MCP 是不是像文档写的那样工作？文件夹限制管不管用？ | [MC：MCP 和命令行](suites/mc-mcp-cli.md) |
| 安装、更新、卸载顺不顺利？会不会联网？ | [IN：下载、安装和网络](suites/in-install.md) |
| 打开大文件快不快，占多少内存？ | [PF：性能](suites/pf-performance.md) |
| 会不会崩溃、丢文件？坏文件会不会把它弄崩？ | [ST：稳定性和数据安全](suites/st-stability.md) |

上游自己的文档列出了很多"没测过"的地方：`docs/gaps.md` 的第 2 号差距是"Rendering is borrowed and its fidelity unmeasured"，第 12 号是"No measured fidelity harness against Acrobat"；`docs/target-app-parity.md` 写着"no side-by-side comparison of rendering, text extraction or form behaviour against Acrobat exists yet"。各套件开头写了它依据的是哪几条。

## 2. 原则

- **只发布测到的。** 没测的写"未测"，不拿官方说法顶替。官方说法和实测不一致时，两者都写，注明版本和日期。
- **结果和环境绑在一起。** 每个结果都写明 PdfCraft 版本、系统、机器、参考软件版本和测试日期。
- **先定方法，再测。** 等级定义、用例和步骤在测试前定好。
- **以同一台机器上的 Acrobat Reader 为主要参考**，macOS 预览为第二参考。显示效果只在同一台机器上比较。Acrobat Reader 不能编辑，所以编辑类用例看的是"PdfCraft 存出的文件在 Acrobat Reader 里是否正常"。
- **人来判定。** 脚本只负责生成文件、搜索残留内容（`scan-leaks.mjs`）和计时；每一个等级都由测试者看过之后给出。MCP 套件里 AI 智能体本身是被测对象，判定仍由人做。
- **隐私相关的结论要有文件证据。** 密文、清理、删除页面、保存方式这几类用例，除了看屏幕，还要用 `scan-leaks.mjs` 检查存出的文件，输出存进记录。
- **拿不准时选更差的一级**，并在备注里写原因。
- **不打总分，不打星。** 只报告各等级的数量和具体问题。
- **可以复现。** 测试文件、生成脚本、原始记录和截图都保留，能公开的公开（§10）。

## 3. 对象、环境和准备

### 3.1 版本

测试分批做（§4.1），每一批开始时用当时最新的正式版，一批之内不换版本。PdfCraft 几天就出一个新版本，每个结果都记着它是在哪个版本上测的，页面上照实写；已经测过的批次由回归批跟进（§8）。

安装包只从官方 GitHub Release 下载，下载后用 `SHA256SUMS.txt` 核对，把文件名和 SHA-256 写进 `run.yaml`。

### 3.2 机器

| 机器 | 用途 | 参考软件 |
|---|---|---|
| Mac（Apple M4，32 GB） | 主测试机 | Adobe Acrobat Reader（免费版）、macOS 预览 |
| Windows 电脑 | 第二台测试机 | Adobe Acrobat Reader（免费版） |

两台机器的具体配置第一次测试时写进 `run.yaml`。

### 3.3 每台机器的准备

1. **新建一个专门测试用的系统用户**（如 "Tester"），在这个用户下测试，让 PdfCraft 以默认设置启动，截图里也不会出现自己的名字和文件。
2. 系统语言用简体中文。英文页面需要的少量英文界面截图，测完后在 PdfCraft 的「首选项 › 界面语言」里临时切换补拍。
3. 关掉 Acrobat Reader 和系统的自动更新，避免中途换版本。实在更新了，写进 `run.yaml` 的 `changes`。
4. 记下系统里装的中文字体（`run.yaml` 的 `fonts.chinese_installed`）。**不要为了测试另装字体**：读者的电脑也不会为了 PdfCraft 去装字体。
5. 截图前，PdfCraft、Acrobat Reader 和预览都设 100% 缩放、单页视图，窗口一样大。
6. 截图保存位置设到本批的 `evidence/` 目录（Mac：⌘⇧5 › 选项 › 存储位置）。
7. 性能测试前接上电源，关掉低电量模式（pf-performance.md 有完整条件）。
8. 测试前把 PdfCraft 的设置和恢复目录改名（Mac：`~/Library/Application Support/PdfCraft`；Windows：`%APPDATA%\PdfCraft` 和 `%LOCALAPPDATA%\PdfCraft`），`run.yaml` 里 `settings: fresh`。
9. 装好检查工具：qpdf 和 poppler（Mac：`brew install qpdf poppler`；Windows：`winget install qpdf.qpdf` 和 poppler 的 Windows 版），记进 `run.yaml` 的 `tools`。它们只用来生成加密文件和检查存出的文件，不参与判定。

### 3.4 测试文件

在准备批 `prep` 里做一次（[batches.md](batches.md)）：

1. 生成：`node tools/make-corpus.mjs`，输出在 `corpus/generated/`。装了 qpdf 和 poppler 时，同时生成加密版本 `SC-ENC-*.pdf` 和扫描图 `CV-SCAN-*.png`。
2. 用 Acrobat Reader 逐个打开 `corpus/generated/` 里的 PDF（`ST-BAD-*` 除外），对照每页开头的 "Expected"。和预期不符的记在 `corpus/baseline.yaml`，这个文件先不用，告诉编辑修生成脚本。
3. 在 Mac 上用「预览」把 `CV-IMG-01.png` 导出成 JPEG（品质最高）和 GIF，存为 `CV-IMG-04.jpg`、`CV-IMG-05.gif`，放进 `corpus/made/`。
4. 按 [corpus/recipes.md](corpus/recipes.md) 用 Acrobat Reader 做几份"别的软件写的"文件（在 Acrobat Reader 里加的批注、填好的表单），放进 `corpus/made/`。
5. 按 [corpus/real-world.md](corpus/real-world.md) 下载 R 类文件，核对 SHA-256。

加密版本的密码：

| 文件 | 加密 | 打开密码 | 所有者密码 |
|---|---|---|---|
| `SC-ENC-RC4-40.pdf` | RC4 40 位 | `user40` | `owner40` |
| `SC-ENC-RC4-128.pdf` | RC4 128 位 | `user128` | `owner128` |
| `SC-ENC-AES-128.pdf` | AES-128 | `user128a` | `owner128a` |
| `SC-ENC-AES-256.pdf` | AES-256 | `user256` | `owner256` |
| `SC-ENC-UNICODE.pdf` | AES-256 | `pässwörd中文` | `owner-unicode` |
| `SC-ENC-OWNER-ONLY.pdf` | AES-256，禁止打印、复制、修改和批注 | （无） | `owner-only` |

## 4. 套件、优先级和用时

- **P0**：第 1 轮先测的范围，各套件的第一个页面由这些用例的结果组成。
- **P1**：第 1 轮完整测试的范围，P0 测完后再做。
- **P2**：有时间再做，或者读者问到再做。

| 套件 | 用例 | P0 | P1 | P2 |
|---|---|---|---|---|
| RD 显示和阅读 | 22 | 7 | 12 | 3 |
| OR 页面整理、合并和拆分 | 12 | 5 | 7 | 0 |
| AN 注释 | 10 | 3 | 6 | 1 |
| FM 表单和签名 | 14 | 5 | 8 | 1 |
| SC 加密、密文和清理 | 21 | 12 | 9 | 0 |
| CV 创建、转换和 OCR | 13 | 5 | 6 | 2 |
| MC MCP 和命令行 | 12 | 5 | 6 | 1 |
| IN 下载、安装和网络 | 14 | 7 | 5 | 2 |
| PF 性能 | 10 | 4 | 6 | 0 |
| ST 稳定性和数据安全 | 15 | 6 | 8 | 1 |
| 合计 | 143 | 59 | 73 | 11 |

用例数包括只在一个系统上测的用例，`new-run.mjs` 会按系统列出准确的清单。上表用 `node tools/count-cases.mjs` 统计（和 `new-run.mjs` 用同一个解析器），改了用例要重新统计。

### 4.1 分批

全部测试拆成每批不超过约 1 小时的小批，测完一批就上线一批（[batches.md](batches.md)）。每批的用时里包含约 10 分钟的固定部分（开始、复判上一批抽到的用例、检查和提交），测试本身约 45–50 分钟。用时是估计值，前几批做完后按实际情况更新 batches.md。一批做不完，就停在用例之间，下一批先补上；不为了赶时间降低判定标准。

## 5. 判定

### 5.1 等级

| 等级 | 含义 | 例子 |
|---|---|---|
| `pass` 一致 | 和参考软件看不出差别；功能按预期完成 | 同样的字形、位置和颜色；只是抗锯齿略有不同，不算差别 |
| `minor` 小差别 | 内容完整、基本正确，有看得见但不影响使用的差别 | 渐变的过渡略有色带；替代字体字形不同但宽度接近、没有错位 |
| `major` 明显差别 | 内容还在，但显示或结果错到影响使用；或者要绕路才能完成 | 中文显示成另一种字体导致换行错位；合并后书签丢了层级；复制出来的文字顺序乱了 |
| `fail` 失败 | 打不开；内容丢失或错误；崩溃、卡死；功能没有或者用不了；密文或清理后内容仍能找回 | 页面一片空白；表单值存了以后 Acrobat 里看不到；`scan-leaks` 找到了本该删掉的内容 |
| `na` 不适用 | 这台机器或这个用例不涉及 | 只有 Windows 才有的右键菜单，在 Mac 上 |
| `blocked` 受阻 | 前一步失败，这一步没法测 | O 是 `fail`，后面的阶段都记 `blocked` |
| `skip` 没测 | 这次没测，note 写原因 | 没有打印机 |

### 5.2 标记

| 标记 | 什么时候用 |
|---|---|
| `leak` | 密文、清理、删除页面或另存为之后，`scan-leaks.mjs` 或其他工具在文件里找到了本该删掉的内容。最严重的问题之一，页面上单独列出，并按 §9 私下报告 |
| `dataLoss` | 保存或往返之后，文字、图片、批注、表单值、书签等内容消失了，而且没有任何提示。页面上单独列出 |
| `crash` | 崩溃，或者 30 秒没有反应。同时在 ST-LOG-01 里记一笔 |
| `repair` | Acrobat Reader 打开 PdfCraft 存的文件时提示文件损坏、要求修复，或者问"是否保存更改"（说明它悄悄修过） |
| `warning` | PdfCraft 打开文件时给出提示。note 里照抄提示原文 |

### 5.3 阶段

| 代号 | 阶段 | 做什么 |
|---|---|---|
| O | 打开 | 在 PdfCraft 里打开文件 |
| D | 显示 | 和参考软件同页、同缩放对比 |
| E | 操作 | 做用例写明的编辑或操作 |
| S | 保存 | 保存或另存为，记下用的是哪一个 |
| R | 重开 | 在 PdfCraft 里重新打开存出的文件，和保存前对比 |
| A | 交给 Acrobat | 用 Acrobat Reader 打开存出的文件，看结果是否正确、有没有修复提示 |
| V | 检查文件 | 用工具检查存出的文件：`qpdf --check`，以及用例写明的 `scan-leaks.mjs`、`pdftotext`、`pdfimages` |
| X | 导出 | 导出或转换，检查得到的文件 |
| T | 任务 | 按步骤完成任务 |
| M | 测量 | 记录数值 |

### 5.4 规则

- 一个阶段只给一个等级，有几处问题时按最重的给。
- 拿不准时选更差的一级，note 里写原因。
- 因为本机没有某个字体、PdfCraft 用了替代字体而造成的差别，照常给等级（读者遇到的就是这个结果），note 里写"字体替换：原字体 → 实际字体"。参考软件也替换了的，写两边各用了什么。
- 上游文档写明不支持的功能，照样测、照样给等级。有没有提示、会不会悄悄出错，比"能不能做"更重要。
- **V 阶段**：`scan-leaks.mjs` 找到本该删除的内容就是 `fail` 加 `leak`，不论屏幕上看起来多干净。它找不到图片里的内容和加密流里的内容，这两种情况用例里写了别的检查方法（`pdfimages` 导出图片目视检查；用密码解密后再扫：`qpdf --password=… --decrypt in.pdf out.pdf`）。
- 先写 note，再给等级。note 要写到不看截图也能明白：哪一页、哪个元素、和参考软件比怎么不同。

### 5.5 复判

每批收尾时用 `check-run.mjs --sample 10` 随机抽 10% 的用例（至少 1 个），在之后某一批的开头不看原记录重新判定，和第一次判定至少隔一天。做法见 [runs/README.md](runs/README.md)。页面上报告两次判定的一致率。

## 6. 证据

**截图**

- 文件名：`<用例ID>-<阶段>-<软件>[-<序号>].png`，软件写 `pdfcraft`、`acrobat`、`preview`、`system`（系统弹窗）。例：`RD-TXT-02-D-pdfcraft.png`、`IN-INS-02-T-system-1.png`。
- 对比截图两边同一页、同缩放、窗口一样大，只截窗口。
- 等级是 `minor`、`major`、`fail` 的阶段，至少一对截图。P0 用例即使 `pass` 也截一对，页面展示用。
- 截图里不能有个人信息：用户名、邮箱、真实文件名和路径。

**录屏**：启动、打开计时、卡顿和崩溃用录屏，命名同截图，扩展名 `.mov` 或 `.mp4`。

**文件**：PdfCraft 保存或导出的文件放 `outputs/`，名为 `<探针或用例名>.pdfcraft.<扩展名>`，例如 `SC-RED-01.pdfcraft.pdf`。这样 `scan-leaks.mjs` 能自动找到它对应的探针。

**检查输出**：`scan-leaks.mjs`、`qpdf --check`、`pdftotext` 等的输出存成 `evidence/<ID>-<说明>.txt`，例如 `node tools/scan-leaks.mjs runs/…/outputs/SC-RED-01.pdfcraft.pdf --keep > runs/…/evidence/SC-RED-01-V-scan.txt`。

**日志**：每批测完把 PdfCraft 日志复制到 `logs/<日期>.log`；崩溃后马上复制 `pdfcraft.log` 和 `pdfcraft.1.log`。位置：Mac `~/Library/Application Support/PdfCraft/logs/`，Windows `%APPDATA%\PdfCraft\data\logs\`。上游说日志里不写密码（SC-LOG-01 会核实）。

## 7. 记录

每一批一个记录目录，格式和工具见 [runs/README.md](runs/README.md)。每批的流程（详见 [batches.md](batches.md)）：

1. `node tools/new-run.mjs --os mac --version 0.17.0 --batch sc1 --from <上一批的目录>`。
2. 复判上一批抽到的用例。
3. 按本批的用例测，边测边填对应的 `.yaml`。
4. `node tools/check-run.mjs <本批目录> --sample 10`，修掉所有 error，记下要复判的用例，提交。

## 8. 回归测试

每个新版本发布后三天内，在 Mac 上做一个回归批 `reg`（约 50 分钟）：五个覆盖面最广的核心用例 RD-TXT-02、RD-REAL-01、SC-RED-01、SC-INC-02、FM-FILL-01。一周里出了几个版本，只回归最新的那个。

发布说明里提到修了我们判过非 `pass` 的用例时，把这些用例另排回归批（`--batch reg --add …`），每批照样控制在 1 小时内。

结果写进该版本的发布说明页（"实测变化"），测试页面上标出哪些结果已经在新版本上复测过。每隔大约一个月，或者上游宣布进入 Beta 时，在最新版本上重做一轮 P0。

## 9. 向上游报告问题

1. 先在 [PdfCraft 的 issue](https://github.com/storytold/pdfcraft/issues) 里搜，有人报过就在那条下面补充我们的版本、系统和测试文件。
2. 没有就新建：写清步骤、预期、实际结果、版本、系统，附上最小的测试文件（我们自己做的文件以 CC BY 4.0 提供）和截图、日志片段。
3. **`leak` 和其他安全问题不发公开 issue**：用 GitHub 仓库的 Security › Report a vulnerability 私下报告，`issue` 字段写 `private report`。上游修好、发布之后，页面再写细节。
4. 把 issue 地址填进记录的 `issue` 字段。问题修好后，在回归测试里复测。

issue 只用来说明问题，不在 issue 里推广 GetPdfCraft。

## 10. 公开

- 测试文件：见 [corpus/README.md](corpus/README.md)。我们做的文件以 CC BY 4.0 公开；第三方文档只公开来源和 SHA-256。
- 原始记录：`runs/` 里的 `run.yaml` 和各套件的记录、截图、检查输出，整体公开。私有样本只公开汇总。还没修好的 `leak` 问题，记录里只写"已私下报告"，细节等上游发布修复后再补。
- 页面：在 [getpdfcraft.org](https://getpdfcraft.org) 上。每批测完后 1–2 天内写进页面上线。页面写明测试日期、版本、机器和参考软件版本，计划和已测的用例数，链接到本方案和原始记录。

## 11. 局限

- 一位测试者，两台机器。判定有主观成分，用复判来控制。
- 参考是免费的 Acrobat Reader，不是 Acrobat Pro：编辑、密文、OCR 这类功能没法在参考软件里做同样的操作，只能检查 PdfCraft 的结果在 Acrobat Reader 里对不对。
- 测试文件和真实文档的样本有限，不代表所有文件。生成的探针文件刻意简单，真实文件的问题要靠 R 类文件发现。
- `scan-leaks.mjs` 找的是已知的标记文字。它说"找不到"，只说明这些标记不在文件里，不证明文件里没有别的残留。
- 结果只对写明的版本有效。

## 修订记录

| 日期 | 版本 | 修改 |
|---|---|---|
| 2026-11-02 | 1.0 | 第一版：10 个套件，143 个用例，测试文件生成脚本、泄漏检查工具和记录工具 |
