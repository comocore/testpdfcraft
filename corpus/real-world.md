# 真实文档（R 类）

第三方文档不进仓库（`corpus/real/` 被 `.gitignore` 排除），只记来源和 SHA-256。准备批里下载到 `corpus/real/`，用 `shasum -a 256` 核对；和下表不同（网站更新了文件），记下新的 SHA-256 和下载日期，改这张表，在提交说明里写明。

| 代号 | 文件 | 来源 | 下载日期 | SHA-256 | 用于 |
|---|---|---|---|---|---|
| R-PAPER | `attention-is-all-you-need-v7.pdf` | https://arxiv.org/pdf/1706.03762v7 （arXiv，LaTeX 排版，公式和图表） | 2026-11-02 | `bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697` | RD-REAL-01、CV-DOCX-02 |
| R-W9 | `fw9.pdf` | https://www.irs.gov/pub/irs-pdf/fw9.pdf （美国国税局 W-9 表，可填写，公有领域） | 2026-11-02 | `2d420cbb4123dcf1fb82595b2359cfbb5d81f00b9df9d359fcc7af361d093f53` | RD-REAL-02、FM-FILL-02 |
| R-MANUAL | `p17.pdf` | https://www.irs.gov/pub/irs-pdf/p17.pdf （IRS Publication 17，数百页，表格和插图多，公有领域） | 2026-11-02 | `2d2381d62c7c77ed4b64b83ac23c28ed85b7c8304eb580c09bd9fd660be0840b` | RD-REAL-04、PF-OPEN-03 |
| R-PDF2 | `simple-pdf-2.0.pdf` | https://github.com/pdf-association/pdf20examples （PDF Association 的 PDF 2.0 示例 "Simple PDF 2.0 file.pdf"） | 2026-11-02 | `296d2a0b2ce19b606f29265694f194a754fbc61783982b5b8d730e8637482236` | RD-PDF2-01 |
| R-ZH-REPORT | 待定 | 准备批里选一份公开的中文 PDF：政府公报、统计公报或学术期刊的论文，最好是 Word 或 WPS 导出、没有嵌入全部字体的。记下网址 | | | RD-REAL-03 |
| R-SCAN | 待定 | 准备批里选一份公开的扫描件 PDF（例如图书馆或档案馆的扫描文档），或者自己扫描一页没有个人信息的印刷品 | | | RD-REAL-05、CV-OPT-02 |
| R-DRAWING | 待定 | 一份公开的矢量工程图或地图 PDF，例如 USGS 地形图或开源硬件项目的电路图 | | | RD-REAL-06 |
| R-SIGNED | 待定 | 一份公开的、带数字签名的 PDF（例如政府机构发布的签名文件），Acrobat Reader 能显示签名面板 | | | FM-SIG-02 |
| R-XFA | 待定 | 一份公开的 XFA 表单（Acrobat 里能填、其他阅读器常显示"请用 Adobe Reader 打开"的那种） | | | FM-XFA-01 |
| R-FUZZ | 待定 | pdf.js 仓库 `test/pdfs/` 里几个标明损坏或模糊测试来源的文件（Apache-2.0），记下文件名和提交号 | | | ST-BAD-08 |

"待定"的几行，在准备批里选定后补全这张表；选不到合适的，对应用例记 `skip` 并写原因。
