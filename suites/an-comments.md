# AN：注释

回答"我加的批注别人能不能看到，别人加的我能不能看到"。依据：README 列出便笺、文字标记、形状、手绘、文本框，"Comments appear as threaded conversations"；0.16.1 起能从另一个 PDF 导入注释，单条回复可以单独编辑和删除。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| AN-ADD-01 | P0 | Mac Win | E S R A | G | 添加各种注释 | 在 `AN-BASE.pdf` 第 1 页依次加：便笺、高亮、下划线、删除线、波浪线、文本框、矩形、椭圆、直线、箭头、手绘、图章，每个都写一句内容。A：Acrobat Reader 的注释列表里 12 条都在，类型、颜色、位置、作者、内容都对；note 写缺了哪条、错了什么 |
| AN-THR-01 | P0 | Mac Win | E S A | G | 回复和状态 | 在一条便笺下回复两次（一条中文），把状态设为「已接受」，再单独删除一条回复（0.16.1 起）。A：Acrobat 里是一个讨论串，回复顺序和状态对 |
| AN-RD-01 | P0 | Mac Win | O D | A | 读别的软件加的注释 | 打开 `AN-EXIST.pdf`（生成，没有外观流）和 `corpus/made/AN-ACROBAT.pdf`（按 recipes.md 在 Acrobat Reader 里加的）。两份都看注释面板：数量、类型、回复串、中文回复，以及页面上的显示 |
| AN-CJK-01 | P1 | Mac Win | E S A | G | 中文注释 | 在 `AN-BASE.pdf` 加中文便笺和中文文本框，保存。A：Acrobat 里中文不是方框；R：PdfCraft 重开也正常 |
| AN-ROT-01 | P1 | Mac Win | E S A | G | 旋转页面上的注释 | 在 `OR-SIZES.pdf` 第 2 页（旋转 90°）和第 5 页（旋转 270°）各加一个文本框和一个图章。A：文字和图章都是正的（#1398 修过图章） |
| AN-IMP-01 | P1 | Mac Win | E A | G | 导入注释 | 把 `AN-EXIST.pdf` 的注释导入 `AN-BASE.pdf` 的副本：一次从 PDF 直接导入（0.16.1 起），一次先导出 XFDF 再导入。位置一致，回复串保留 |
| AN-EXP-01 | P1 | Mac Win | X | G | 导出注释 | 把 `AN-EXIST.pdf` 的注释导出为 FDF 和 XFDF，在 Acrobat Reader 里导入到原文件的副本（「注释 › 导入」），看数量和位置 |
| AN-FLAT-01 | P1 | Mac Win | E S A | G | 拼合注释 | 在 AN-ADD-01 的结果上「拼合注释」，保存。A：注释成了页面内容，注释列表为空，外观和拼合前一样 |
| AN-MOVE-01 | P1 | Mac Win | E | G | 移动和改样式 | 拖动、缩放几个注释，改颜色和线宽；撤销、重做。拖动时预览跟着走（0.16.1 起） |
| AN-SUM-01 | P2 | Mac | X | G | 注释摘要 | 对 `AN-EXIST.pdf` 生成注释摘要 PDF，内容完整、可读 |
