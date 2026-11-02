# MC：MCP 和命令行

回答"命令行和 MCP 是不是像文档写的那样工作，文件夹限制管不管用"。依据：README "Built for agents, too"，`docs/mcp.md`（`--root`、`--automation-read-root`、`--automation-write-root`、`--compact`、"opens no port"），`docs/cli-batch.md`，`pdfcraft-cli --help`。

MCP 用例里，AI 智能体本身是被测对象：记下客户端（如 Claude Code）、模型和版本，把对话记录存进 evidence。所有操作在 `runs/<本批>/work/` 里的副本上做。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| MC-CLI-01 | P0 | Mac Win | T | G | 查看和提取 | `pdfcraft-cli info RD-NAV-01.pdf`（页数 30、书签、页码标签）；`text RD-FIND-01.pdf` 和 `pdftotext` 对比顺序；`text RD-TXT-02.pdf --page 1` 中文是否正确；`render RD-GFX-01.pdf --page 1 --dpi 150 --out x.png` 和 PdfCraft 窗口里一样。输出存进 evidence |
| MC-CLI-02 | P0 | Mac Win | T | G | 合并、提取、拆分 | 按 README 的三条命令处理 `OR-SRC-A.pdf` 和 `OR-SRC-B.pdf`，结果在 Acrobat Reader 里检查（同 OR-CMB-01、OR-EXT-01、OR-SPL-01 的要点） |
| MC-CLI-03 | P1 | Mac Win | T | G | edit 命令 | `pdfcraft-cli edit OR-SRC-A.pdf --rotate 1,2:90 --delete 5 --move 9:1 --title "Q3" --out out.pdf`：选项按顺序执行，页码指执行前面选项之后的文档 |
| MC-CLI-04 | P1 | Mac Win | T | G | 批处理 | `pdfcraft-cli batch` 对 `corpus/generated/` 里的 PF-CMB 文件做 optimize；对 CV-IMG 图片做 convert,optimize。看 JSON 报告、输出文件、原文件没被改 |
| MC-CLI-05 | P1 | Mac Win | T | G | 脚本和 --root | 写一个 `steps.json`：打开 `OR-SRC-A.pdf`、旋转第 2 页、保存到 `out/`，用 `run --script steps.json --root work --report` 运行；再把保存路径改到 `work` 外面：应被拒绝，报告里写明原因 |
| MC-MCP-01 | P0 | Mac | T | G | 接入 Claude Code | `claude mcp add pdfcraft -- pdfcraft-cli mcp --root <work>`。让智能体：列出 `OR-SRC-A.pdf` 的页数和书签；提取第 3 页文字；把第 2 页旋转 90° 另存到 `out/`；在 `SC-RED-01.pdf` 的副本上把 GPCSECRET-TEXT-0001 密文处理掉并保存。每一步对不对，最后一步用 scan-leaks 检查 |
| MC-MCP-02 | P0 | Mac | T | G | 文件夹限制 | 同一个会话里，让智能体读 `--root` 外面的一个 PDF、往外面写一个文件、通过指向外面的链接（`ln -s`）读文件。三次都应被拒绝，错误信息写进 note |
| MC-MCP-03 | P1 | Mac | T | G | 分开的读写根目录 | `--automation-read-root work --automation-write-root work/out`：能读 work，能写 work/out，不能写 work |
| MC-MCP-04 | P1 | Mac | M | G | --compact | 有无 `--compact` 时 `tools/list` 返回的工具数（让智能体报告，或用 MCP Inspector）；compact 下 `tool_search` 能找到 `page_rotate` 并调用成功 |
| MC-MCP-05 | P1 | Mac Win | T | G | 不开网络端口 | MCP 会话进行中，`lsof -i -P -n \| grep pdfcraft`（Windows：`Get-NetTCPConnection -OwningProcess …`）：没有任何监听端口 |
| MC-CTL-01 | P0 | Mac | T | G | 控制通道的安全 | `pdfcraft --control ~/ctl.json RD-NAV-01.pdf`：控制文件权限是 600；它只监听 127.0.0.1（`lsof`）；把控制文件换成符号链接、或 `chmod 644` 后，`pdfcraft-cli ui` 拒绝使用 |
| MC-CTL-02 | P2 | Mac | T | G | 用控制通道操作界面 | `inspect query=rotate`、`click label="Organize pages"`、`screenshot`、`quit`（有未保存改动时应提示而不是直接退出） |
