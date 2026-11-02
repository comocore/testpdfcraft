# ST：稳定性和数据安全

回答"会不会崩溃、丢文件，坏文件会不会把它弄崩"。依据：README "Every save appends your changes … Writes are atomic … nothing is lost if you close by mistake"、"Changes are autosaved every minute. If PdfCraft ever quits unexpectedly, it offers to recover your work"、"Encrypted documents stay encrypted on disk"，以及 "fuzzing still turns up crashes and hangs on hostile files"；0.17.0 修了一个约 1 KB 的文件就能让它申请几十 GB 内存的问题（PR #5620）。

所有用例都用文件的副本做。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| ST-BAD-01 | P0 | Mac Win | O | G | 截断的文件 | `ST-BAD-01-truncated.pdf`（只有前 60%）。应能打开已有的页面或给出看得懂的错误，不崩溃、不卡住。Acrobat Reader 的表现也记下 |
| ST-BAD-02 | P0 | Mac Win | O | G | 交叉引用表错位 | `ST-BAD-02-xref.pdf`：应自动修复并显示 5 页；有没有提示 |
| ST-BAD-03 | P1 | Mac Win | O | G | 页面树循环 | `ST-BAD-03-cycle.pdf`：不卡死，不崩溃 |
| ST-BAD-04 | P1 | Mac Win | O | G | 嵌套 2 万层的数组 | `ST-BAD-04-deep.pdf`：不崩溃 |
| ST-BAD-05 | P1 | Mac Win | O M | G | 解压炸弹 | `ST-BAD-05-bomb.pdf`：一个能解压成 256 MB 的内容流。不崩溃；M 记打开时内存峰值（MB） |
| ST-BAD-06 | P1 | Mac Win | O | G | 空文件和假 PDF | `ST-BAD-06-empty.pdf`（0 字节）和 `ST-BAD-06-png.pdf`（改了扩展名的图片），各记一次提示原文 |
| ST-BAD-07 | P1 | Mac Win | T | G | 0.17.0 修过的内存问题 | `ST-MASK-01.pdf`：导出全部图片，再「减小文件大小」。0.17.0 起应正常完成；记下内存峰值 |
| ST-BAD-08 | P2 | Mac Win | O | R | 模糊测试样本 | real-world.md 的 R-FUZZ（pdf.js 测试集里标为损坏的几个文件）：不崩溃 |
| ST-SAV-01 | P0 | Mac | T | G | 磁盘满时保存 | 磁盘工具 › 文件 › 新建映像 › 空白映像，20 MB，APFS。把 `PF-CMB-01.pdf` 复制进去，再用大文件把映像塞到只剩约 1 MB。在 PdfCraft 里打开映像里的文件，插入 `RD-IMG-01.pdf` 的页面后保存：应提示空间不足；原文件仍能用 Acrobat 正常打开；映像里不留临时文件 |
| ST-SAV-02 | P0 | Mac Win | T | G | 保存时强制退出 | 打开 `PF-IMG-60.pdf` 的副本，旋转一页，按保存后立刻强制退出（Mac：⌥⌘Esc；Windows：任务管理器）。原文件完好（Acrobat 能打开，页数对），旁边不留临时文件；留下了就记文件名。做 3 次 |
| ST-SAV-03 | P1 | Win | T | G | 文件同时被 Acrobat 打开 | Acrobat Reader 打开一份副本，PdfCraft 也打开同一个文件，改后保存：两边各有什么提示，最后文件里是什么 |
| ST-SAV-04 | P1 | Mac Win | T | G | 只读文件和没有写权限的文件夹 | 副本设成只读后保存；保存到没有写权限的文件夹。应有清楚的提示，不能悄悄失败 |
| ST-SAV-05 | P1 | Win | T | G | 隐藏文件保存后仍隐藏 | 把副本设为隐藏（属性 › 隐藏），编辑保存后仍是隐藏的（0.15.0 起） |
| ST-REC-01 | P0 | Mac Win | T | G | 崩溃后恢复 | 分两次做，每次改完等 70 秒（超过一分钟的自动备份间隔）后强制退出，再打开 PdfCraft：a `AN-BASE.pdf` 的副本加三个注释；b `SC-ENC-AES-256.pdf`（密码 user256）加一个注释。看：是否提示恢复，恢复后内容完整，原文件没被改；b 的恢复副本在恢复文件夹里是加密的（用 scan-leaks 扫恢复文件夹里的文件：找不到 GPCENC-PLAIN-0001；`qpdf --show-encryption` 显示加密）。记下恢复文件夹里的文件名和大小 |
| ST-LOG-01 | P0 | Mac Win | T | — | 整轮测试的崩溃记录 | 不是单独做的用例。每一批里每一次崩溃、卡死（30 秒没反应）都在这一条的 `events` 里记一行：时间、在做哪个用例、操作、日志文件名。崩溃后马上复制日志（`pdfcraft.log` 和 `pdfcraft.1.log`） |
