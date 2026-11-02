# RD：显示和阅读

回答"别人发来的 PDF 能不能正常显示、找得到、复制得对"。依据：上游 `docs/gaps.md` 第 2 号差距"Rendering is borrowed and its fidelity unmeasured"（页面由 hayro 绘制，没有和 Acrobat 对比测量过），用户报告过 TikZ 图案填充画错（#794）、1080p/1440p 下文字发虚（#730）、固定缩放比例和 Acrobat 不同（#739）；0.16.1 修了 Windows 上没有嵌入字体的中文 PDF 显示空白（#4172）。

参考：同一台机器上的 Acrobat Reader（主）和 macOS 预览（次）。D 阶段三个窗口同页、同缩放（100%），截图对比。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| RD-TXT-01 | P1 | Mac Win | O D | G | 标准 14 种字体 | `RD-TXT-01.pdf`。每行字体是否各不相同；Symbol 显示希腊字母、ZapfDingbats 显示符号而不是字母；WinAnsi 行的重音字母、欧元符号、长短破折号 |
| RD-TXT-02 | P0 | Mac Win | O D T | G | 没有嵌入字体的中文 | `RD-TXT-02.pdf` 两页：第 1 页 UniGB-UCS2-H 编码的宋、黑、楷、仿宋；第 2 页 GBK-EUC-H 编码。看：有没有空白和方框；四种字体是否分得开（note 写每块实际用了系统里的哪个字体，参考软件也写）。T：在第 1 页选一段文字复制到文本编辑器，和页面一致；搜索「表格」，命中数和 Acrobat 一样 |
| RD-TXT-03 | P1 | Mac Win | O D | G | 竖排中文 | `RD-TXT-03.pdf`。从上到下、从右到左；逗号句号在格子右上角 |
| RD-TXT-04 | P1 | Mac Win | O D | G | 没有嵌入字体的日文和韩文 | `RD-TXT-04.pdf`。不出现方框 |
| RD-GFX-01 | P0 | Mac Win | O D | G | 渐变、混合模式、透明 | `RD-GFX-01.pdf`。九个混合模式方块逐个和 Acrobat 比，差的写在 note 里（哪个模式、颜色怎么不同） |
| RD-GFX-02 | P1 | Mac Win | O D | G | 软蒙版和 CMYK 透明组 | `RD-GFX-02.pdf`。蓝条上左边是洞、右边半透明；下面红青重叠处接近黑色 |
| RD-GFX-03 | P1 | Mac Win | O D | G | 平铺图案 | `RD-GFX-03.pdf`。圆和方块里的棋盘格大小、方向和 Acrobat 一样（#794 的同类问题） |
| RD-IMG-01 | P1 | Mac Win | O D | G | 各种图片 | `RD-IMG-01.pdf`。彩色、灰度、黑白、带软蒙版四张图 |
| RD-OCG-01 | P1 | Mac Win | O D T | G | 图层 | `RD-OCG-01.pdf`。图层面板列出 3 个图层；「Hidden by default」默认关；「Print only」屏幕上不显示。T：逐个开关，页面立即重画；打印预览里「Print only」出现（Acrobat Reader 也看一遍） |
| RD-NAV-01 | P0 | Mac Win | O D T | G | 书签、页码标签和链接 | `RD-NAV-01.pdf`。书签嵌套三层，中文书签显示正确；页码显示 i–iv、1–26，跳转输入「16」到的是标签 16；第 1 页三个链接：两个跳转正确，网页链接先询问再打开 |
| RD-NAV-02 | P1 | Mac Win | T | G | 阅读视图 | 用 `RD-NAV-01.pdf` 依次切换单页、连续、双页、全屏、「阅读」模式、旋转视图、深色主题和阅读配色。都能切换、能切回来，页面不乱 |
| RD-FIND-01 | P0 | Mac Win | O T | G | 阅读顺序和搜索 | `RD-FIND-01.pdf`。全选复制，顺序是左栏、右栏、脚注；搜索每栏第一个词，命中 4 次。用 `pdftotext RD-FIND-01.pdf -` 的结果作对照，写进 evidence |
| RD-ZOOM-01 | P1 | Mac Win | D | G | 放大和清晰度 | `RD-TXT-01.pdf` 放大到 400% 和 1600%，文字边缘清楚，没有马赛克；记下工具栏里能选的固定缩放比例，和 Acrobat 的比较（#739） |
| RD-HIDPI-01 | P2 | Win | D | G | 高分屏缩放下的清晰度 | Windows 显示缩放设为 125% 和 150%，看 `RD-TXT-01.pdf` 100% 时文字是否发虚（#730），和 Acrobat 对比截图 |
| RD-REAL-01 | P0 | Mac Win | O D T | R | 真实文档：学术论文 | real-world.md 的 R-PAPER（LaTeX 排版、公式、图表）。前 3 页对比；T：复制一段带公式的文字 |
| RD-REAL-02 | P0 | Mac Win | O D | R | 真实文档：政府表格 | R-W9。显示对比（填写在 FM-FILL-02） |
| RD-REAL-03 | P1 | Mac Win | O D T | R | 真实文档：中文公文或报告 | R-ZH-REPORT。显示对比；T：复制一段，搜索一个词 |
| RD-REAL-04 | P0 | Mac Win | O D | R | 真实文档：图片多的手册 | R-MANUAL。前 5 页对比，翻页是否顺畅 |
| RD-REAL-05 | P1 | Mac Win | O D | R | 真实文档：扫描件 | R-SCAN。显示对比，图像有没有错位、反色 |
| RD-REAL-06 | P1 | Mac Win | O D | R | 真实文档：带矢量图的工程图或地图 | R-DRAWING。放大到 400% 看细线 |
| RD-PDF2-01 | P2 | Mac | O D | R | PDF 2.0 文件 | R-PDF2。能打开，显示正常 |
| RD-WEB-01 | P2 | Mac | O D | G | 网页版 | 按 in-install.md IN-WEB-01 部署网页版，打开 `RD-TXT-02.pdf` 和 `RD-NAV-01.pdf`。中文界面会显示方框（上游已说明），看页面内容本身是否正常 |
