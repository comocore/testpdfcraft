# PF：性能

回答"打开大文件快不快，占多少内存"。依据：`docs/gaps.md` 第 13 号"Performance budgets and lazy loading of very large files"（大文件内存测过，懒加载还没做）。

条件：接电源，关闭低电量模式，关掉其他程序；每项测 5 次，记 5 个数，第一次之前先打开关闭一次（热缓存），冷启动另记。计时用录屏逐帧读 `tools/stopwatch.html`，或按用例写的终点用秒表。内存用活动监视器的"内存"列（Windows：任务管理器的"内存"列），单位 MB。参考软件是 Acrobat Reader，`acrobat` 一栏记它的数。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| PF-START-01 | P0 | Mac Win | M | — | 启动 | 从点击图标到主页出现。冷启动（重启电脑后第一次）单独记在 note |
| PF-OPEN-01 | P0 | Mac Win | M | G | 打开 1000 页文本 | `PF-TEXT-1000.pdf`：从拖进窗口到第 1 页文字清晰。另记：跳到第 1000 页用了多久 |
| PF-OPEN-02 | P0 | Mac Win | M | G | 打开 60 页大图 | `PF-IMG-60.pdf`：到第 1 页清晰；快速滚到最后一页，记卡顿（note） |
| PF-OPEN-03 | P1 | Mac Win | M | R | 打开真实的大文档 | R-MANUAL：到第 1 页清晰 |
| PF-MEM-01 | P0 | Mac Win | M | — | 空闲内存 | 启动后停在主页 1 分钟的内存 |
| PF-MEM-02 | P1 | Mac Win | M | G | 大文件内存 | 打开 `PF-IMG-60.pdf` 并滚到底后的内存；关掉文件 1 分钟后的内存 |
| PF-SAVE-01 | P1 | Mac Win | M | G | 保存大文件 | `PF-TEXT-1000.pdf` 旋转一页后保存，和另存为，各自用时 |
| PF-CMB-01 | P1 | Mac Win | M | G | 合并 20 个文件 | 把 `PF-CMB-01…20.pdf` 一次合并（100 页） |
| PF-CLI-01 | P1 | Mac Win | M | G | 命令行提取文字 | `time pdfcraft-cli text PF-TEXT-1000.pdf > /dev/null`（Windows：`Measure-Command`） |
| PF-SIZE-01 | P1 | Mac Win | M | — | 安装后占用空间 | Mac：应用的大小（显示简介）；Windows：安装目录的大小 |
