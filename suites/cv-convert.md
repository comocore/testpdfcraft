# CV：创建、转换和 OCR

回答"图片能不能做成 PDF，导出 Word 能用吗，OCR 认不认中文，压缩能压多少"。依据：`docs/file-format-parity.md`（从图片、文本、剪贴板创建；导出 Word 只到"basic"，不保留版式；PowerPoint、HTML、RTF、纯文本；不能从 Office 文件创建）、`docs/gaps.md` 第 7 号（OCR 只认不带重音的拉丁字母）和第 8 号（Office 转换）；0.16.1 的黑白图片压缩（CCITT G4、JBIG2）和 Markdown 导出。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| CV-IMG-01 | P0 | Mac Win | E S A | G | 用图片创建 PDF | 「创建 PDF › 图片」依次用 `CV-IMG-01.png`（150 ppi，应为 6×4 英寸）、`CV-IMG-02.bmp`、`CV-IMG-03.tif`（3 页）、`corpus/made/CV-IMG-04.jpg`、`CV-IMG-05.gif`。A：页数、页面尺寸、颜色、方向和原图一致 |
| CV-IMG-02 | P1 | Win | T | G | 右键菜单创建 PDF | Windows：在资源管理器里右键 `CV-IMG-01.png` › 显示更多选项 › Create PDF with PdfCraft…，结果同 CV-IMG-01 |
| CV-TXT-01 | P1 | Mac Win | E A | G | 用文本创建 PDF | `CV-TXT-01.txt`（中英文）。A：中文不是方框，段落和换行保留 |
| CV-DOCX-01 | P0 | Mac Win | X | G | 导出为 Word | `CV-REPORT.pdf` 导出 .docx，用 Word（或 WPS、LibreOffice，note 写用了哪个）打开：文字是否完整、顺序对；标题、粗斜体、列表、表格、图片各保留了多少；版式（上游说不保留）差到什么程度 |
| CV-DOCX-02 | P1 | Mac Win | X | R | 导出真实文档为 Word | R-PAPER 前 3 页导出 .docx，同上 |
| CV-PPTX-01 | P1 | Mac Win | X | G | 导出为 PowerPoint | `CV-REPORT.pdf` 导出 .pptx，每页一张幻灯片，标题、文字、图片、表格 |
| CV-EXP-01 | P1 | Mac Win | X | G | 导出 HTML、RTF、纯文本、Markdown、图片 | `CV-REPORT.pdf` 依次导出；纯文本和 `pdftotext` 的结果对比；Markdown（0.16.1 起，命令行 `run doc_export_office` 写 .md）里标题、表格；导出 PNG 的分辨率 |
| CV-OCR-01 | P0 | Mac Win | E S A T | G | 英文扫描件 OCR | 用 `CV-SCAN-EN-1.png` 创建 PDF，再「识别文本」。T：搜索和复制正文，和 `CV-REPORT.pdf` 原文比，错了多少词（数前 100 个词）；A：Acrobat 里也能搜到 |
| CV-OCR-02 | P1 | Mac Win | E T | G | 带重音的拉丁文字 | 做一张法文/德文的扫描图（recipes.md），OCR 后看 é、ü、ß 怎么识别（上游说只认不带重音的） |
| CV-OCR-03 | P0 | Mac Win | E T | G | 中文扫描件 OCR | `CV-SCAN-ZH-1.png` 创建 PDF 后「识别文本」。上游说不支持中文：看 PdfCraft 有没有提示、会不会生成乱码文字层（复制出来是什么，写进 note） |
| CV-OPT-01 | P0 | Mac Win | E S A M | G | 减小文件大小 | `PF-IMG-60.pdf`（大小见 manifest.json）「减小文件大小」，记下前后大小和用时；A：Acrobat 里能打开，抽 3 页看图片质量 |
| CV-OPT-02 | P2 | Mac Win | E S A M | R | 黑白扫描件压缩 | R-SCAN「减小文件大小」，前后大小；黑白页是否用了 CCITT G4 或 JBIG2（`pdfimages -list` 的 enc 列，0.16.1 起） |
| CV-PDFA-01 | P2 | Mac | E S V | G | 另存为 PDF/A | `CV-REPORT.pdf` 另存为 PDF/A-2b；V：有 veraPDF 就验证，没有记 `skip` |
