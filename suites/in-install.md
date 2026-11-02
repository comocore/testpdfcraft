# IN：下载、安装和网络

回答"安装、更新、卸载顺不顺利，会不会联网"。依据：README 的 Downloads（签名者、MSI 选项、便携版的 portable.txt）、`packaging/windows/INSTALLATION.md`（0.15.0 起默认按用户安装）、Flatpak 的权限、"no account, no telemetry, no cloud"，以及 0.15.0 起启动时检查更新（`apps/pdfcraft/src/main.rs`）。

网络监控：Mac 用 LuLu 或 Little Snitch，Windows 用 TCPView 或资源监视器；记进 `run.yaml` 的 `tools`。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| IN-DL-01 | P0 | Mac Win | T | — | 下载和校验 | 从 GitHub Release 下载本机的安装包和 `SHA256SUMS.txt`，`shasum -a 256 -c`（Windows：`Get-FileHash`）。写进 run.yaml |
| IN-SIG-01 | P0 | Mac | T | — | Mac 签名和公证 | 挂载 DMG：`codesign -dv --verbose=4`、`codesign --verify --deep --strict`、`spctl -a -vv`、`xcrun stapler validate`；签名者应为 Learning Machines LLC（DJ6XS33FX8）。CLI zip 里的 `pdfcraft-cli` 同样检查。输出存进 evidence |
| IN-SIG-02 | P0 | Win | T | — | Windows 签名 | .msi 和便携版里的两个 .exe：属性 › 数字签名，签名者 Learning Machines Inc，时间戳有效；PowerShell `Get-AuthenticodeSignature`。输出存进 evidence |
| IN-INS-01 | P0 | Mac | T | — | Mac 安装和首次启动 | 拖进「应用程序」，第一次打开时系统提示的原文（截图）；不应出现"无法验证开发者" |
| IN-INS-02 | P0 | Win | T | — | Windows 安装版 | 默认选项安装：不弹管理员确认；装在 `%LOCALAPPDATA%\Programs\ArtCraft\PdfCraft`；开始菜单和桌面有快捷方式；PDF 的右键菜单有 Edit with PdfCraft，图片的有 Create PDF with PdfCraft…；默认 PDF 程序没被改。SmartScreen 的提示截图 |
| IN-INS-03 | P1 | Win | T | — | 为所有人安装 | 先卸载，再选 Everyone on this computer：要管理员确认，装在 `C:\Program Files\ArtCraft\PdfCraft`。再试一次在已为自己安装的情况下为所有人安装：上游说会拒绝，记下提示 |
| IN-INS-04 | P1 | Win | T | — | 便携版 | 解压到 U 盘或任意文件夹运行：`PdfCraftData` 出现在 exe 旁边，`%APPDATA%\PdfCraft` 和 `%LOCALAPPDATA%\PdfCraft` 都没有新建 |
| IN-INS-05 | P2 | Win | T | — | 静默安装 | 管理员 PowerShell：`msiexec /i <msi> /qn /norestart INSTALLDESKTOPSHORTCUT=0 ALLUSERS=1`，没有桌面快捷方式，其余同 IN-INS-03 |
| IN-1ST-01 | P0 | Mac Win | T | — | 首次启动 | 系统语言为简体中文时，界面是中文且没有方框（桌面版内置霞鹜文楷 Lite）；主页、「所有工具」、首选项都能打开。记下启动后默认的主题、版式 |
| IN-NET-01 | P0 | Mac Win | T | — | 启动时的网络连接 | 开着网络监控启动 PdfCraft，等 2 分钟：只应连到 GitHub（api.github.com，可能还有 github.com 的下载地址），记下每个连接的主机。然后打开、编辑、保存几个 PDF 10 分钟：不应再有连接 |
| IN-NET-02 | P1 | Mac Win | T | — | 断网时 | 断开网络启动：不报错、不卡住；「帮助 › 检查更新」给出清楚的提示 |
| IN-UPD-01 | P1 | Mac Win | T | — | 从旧版本更新 | 先装 0.16.1（或上一个版本），启动后出现更新提示：截图；有未保存文档时选更新并重启，应先问怎么处理；更新后版本号、设置都在 |
| IN-UNI-01 | P1 | Mac Win | T | — | 卸载 | Windows：设置 › 应用 › 卸载；Mac：拖到废纸篓。记下留下了哪些文件夹（和下载页写的对照） |
| IN-WEB-01 | P2 | Mac | T | — | 网页版 | 解压 `pdfcraft-web-<版本>.zip`，`python3 -m http.server` 打开；中文界面显示方框（上游已说明），英文界面正常；能打开本地 PDF；打印走浏览器的打印对话框 |
