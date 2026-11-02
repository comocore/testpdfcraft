# 测试文件

| 目录或文件 | 内容 | 进仓库 |
|---|---|---|
| `generated/` | `tools/make-corpus.mjs` 生成的探针文件（G 类）、加密版本和扫描图，以及 `manifest.json`、`SHA256SUMS.txt` | 否，随时可以重新生成 |
| `made/` | 按 [recipes.md](recipes.md) 在 Acrobat Reader、预览里做的文件（A 类）和测试证书 | 是（测试证书的私钥除外，见 recipes.md） |
| `real/` | R 类第三方真实文档，按 [real-world.md](real-world.md) 下载 | 否，只记下载地址和 SHA-256 |
| `baseline.yaml` | 用 Acrobat Reader 核对探针的记录：哪个文件、哪个版本、通过与否、有什么问题 | 是 |

## 生成

```sh
node tools/make-corpus.mjs              # 全部，约 10 秒，约 20 MB（解压后的图片约 670 MB）
node tools/make-corpus.mjs --skip-large # 不含性能测试的大文件 PF-IMG-60.pdf
```

同样的脚本、同样的 Node 版本，每次生成的文件逐字节相同（SHA-256 见 `generated/SHA256SUMS.txt`；`manifest.json` 记着生成时的 Node 版本）。填充用的文字由脚本按固定种子生成，不含任何第三方文本。

每个 PDF 探针的第一页开头写着它的编号、标题和 "Expected"（正确的结果应该是什么样）。`manifest.json` 里每个文件有：

| 字段 | 内容 |
|---|---|
| `case` | 用到它的用例 |
| `purpose` | 它测什么 |
| `secrets` | 应该被删掉的标记文字（GPCSECRET-…），`tools/scan-leaks.mjs` 默认搜索这些 |
| `keep` | 应该留下的标记文字（GPCKEEP-…），`scan-leaks.mjs --keep` 确认它们还在 |

装了 qpdf 时生成 6 个加密版本 `SC-ENC-*.pdf`（密码见 [../README.md](../README.md) §3.4）；装了 poppler 时生成扫描图 `CV-SCAN-EN-1.png` 和 `CV-SCAN-ZH-1.png`。加密用 qpdf 而不是 PdfCraft 来做，这样被测的软件和制作测试文件的软件是两个独立的实现。

## 用 Acrobat Reader 核对

准备批里用 Acrobat Reader 逐个打开 `generated/` 里的 PDF（`ST-BAD-*` 除外），对照 "Expected"。和预期不符的，说明探针本身有问题，在 `baseline.yaml` 里记下来，这个文件先不用，告诉编辑去修生成脚本：

```yaml
acrobat_reader: Adobe Acrobat Reader 2026.002.xxxxx
date: 2026-11-03
files:
  - file: RD-GFX-01.pdf
    ok: true
  - file: RD-TXT-03.pdf
    ok: false
    note: 竖排标点位置和 Expected 不符
```

## 公开和许可

`made/` 里的文件，生成脚本的输出，`runs/` 里的记录，以及方案和用例文档，以 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hans) 公开（[LICENSE-CC-BY-4.0](../LICENSE-CC-BY-4.0)），署名写"GetPdfCraft test corpus, getpdfcraft.org"。`tools/` 里的脚本以 MIT 或 Apache-2.0 双许可公开（[LICENSE-MIT](../LICENSE-MIT)、[LICENSE-APACHE](../LICENSE-APACHE)），和 PdfCraft 本身一样，任选其一。

第三方真实文档不放进仓库、不提供下载，只公开它的来源地址、下载日期和 SHA-256，读者可以自己下载同一个文件来复现。美国政府的文件（IRS 表格）属于公有领域，以后可以随测试数据一起提供。

私有样本（合同、身份证件扫描件等）永远不公开，截图只留在本地。
