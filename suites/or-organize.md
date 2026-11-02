# OR：页面整理、合并和拆分

回答"合并、拆分、调整页面之后，书签、链接、表单还在不在"。依据：README 写明 Combine 时"links and named destinations are rewired to the copied pages; form fields stay interactive; layers keep their on/off defaults; attachments come along"，"Every page of a combined document renders pixel-identical to its source"；0.17.0 起删除页面后保存会整份重写（SC-INC-02 检查文件里还有没有被删的页面）。

文件：`OR-SRC-A.pdf`（10 页 A-01…A-10，每页一个 `GPCPAGE-A-xx` 标记，书签、命名目标、链接、页码标签）、`OR-SRC-B.pdf`（3 页，每页一个文本框）、`OR-SRC-C.pdf`（2 页，一个默认关闭的图层和一个附件）、`OR-SIZES.pdf`（5 种页面尺寸和旋转）。都用副本操作。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| OR-ROT-01 | P0 | Mac Win | E S R A V | G | 旋转页面 | 「组织页面」里选 A-02 和 A-05 旋转 90°，A-07 旋转 180°，保存。R、A：旋转方向一致；V：`qpdf --check` 无错误 |
| OR-DEL-01 | P0 | Mac Win | E S R A V | G | 删除页面 | 删除 A-03、A-04，保存（不是另存为）。R、A：剩 8 页，书签里指向被删页面的条目怎么处理（note 写）；V：`node tools/scan-leaks.mjs <输出> --token GPCPAGE-A-03 --token GPCPAGE-A-04`，0.17.0 起应找不到 |
| OR-INS-01 | P0 | Mac Win | E S R A | G | 插入、移动和撤销 | 在 A-01 后插入空白页；在末尾插入 `OR-SRC-C.pdf`；把 A-10 移到最前；然后撤销三次、重做一次。每一步的结果和撤销记录（「编辑」菜单里的名字）都写进 note；保存后 A 里页序一致 |
| OR-EXT-01 | P0 | Mac Win | E S A | G | 提取页面 | 提取 1、3、5–8 到新文件。A：6 页，顺序对；第 1 页的两个链接：指向 A-07 的仍然有效，指向命名目标的（A-09 没被提取）怎么处理，note 写 |
| OR-SPL-01 | P1 | Mac Win | E A | G | 拆分 | 「拆分文档」每 3 页一份，得到 4 个文件；再按 A-05、A-08 之前拆分，得到 3 个文件。文件名、页数对；每份在 Acrobat 里能打开 |
| OR-CMB-01 | P0 | Mac Win | E S R A V | G | 合并三个文件 | 「合并文件」按 A、B、C 的顺序合并。逐项看并写进 note：书签（每个文件一个顶层书签，原书签在下面）；A 的两个链接仍跳到 A-07 和 A-09；B 的三个文本框能填，值还在；C 的图层仍默认关闭；C 的附件在附件面板里；页面和原文件一模一样。A 阶段在 Acrobat 里再核对书签、表单和附件 |
| OR-CMB-02 | P1 | Mac Win | E A | G | 合并同名表单字段 | 把 `OR-SRC-B.pdf` 和它自己合并一次。同名字段 `b_name_1` 是联动、改名还是丢失？Acrobat 里怎样 |
| OR-CMB-03 | P1 | Mac Win | E A | G | 合并加密文件 | 把 `SC-ENC-AES-256.pdf`（密码 user256）和 `OR-SRC-A.pdf` 合并。要不要输密码；结果是否加密（note 写） |
| OR-LBL-01 | P1 | Mac Win | E S A | G | 页码标签 | 把 `OR-SRC-A.pdf` 前 2 页设为 i、ii，其余从 1 开始。A：Acrobat 里页码框显示一致 |
| OR-CRP-01 | P1 | Mac Win | E S A | G | 裁剪和页面框 | `OR-SIZES.pdf` 第 1 页四边各裁 50 pt。A：Acrobat 里显示裁剪后的大小；`OR-SIZES.pdf` 其余页的尺寸和旋转没被改动 |
| OR-HF-01 | P1 | Mac Win | E S A | G | 页眉页脚、水印、背景、贝茨编号 | 在 `OR-SRC-A.pdf` 上加页脚「第 <<1>> 页」、对角水印「DRAFT 草稿」、浅色背景、贝茨编号 GPC000001 起。A：都显示，中文没有方框；R：「更新」「删除」水印能用 |
| OR-THUMB-01 | P1 | Mac Win | T | G | 缩略图大小和多选 | 在「页面」面板用缩略图大小 50%–150%；⌘/Ctrl 和 ⇧ 多选；「页面工具」菜单（0.15.0 起）里插入、旋转、删除 |
