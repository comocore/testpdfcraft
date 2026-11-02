# SC：加密、密文和清理

回答"密文处理是不是真的删掉了，保存后文件里还藏着什么，加密可不可靠，PDF 里的脚本和链接会不会乱来"。这是 PdfCraft 用户最需要、别处最少见的一组结果。

依据：

- 保存：README "Every save appends your changes and leaves the original bytes untouched"。这意味着普通保存后，旧版本仍在文件里；上游的测试和 `crates/redact/README.md` 写明应用密文、清理文档、加密之后下一次保存会整份重写；0.17.0 起，在没有签名的文件里删除页面后保存也会整份重写（PR #4279）。
- 密文：`crates/redact/README.md`（文字、图片像素、矢量、表单 XObject、注释、表单字段），0.15.0 的两个安全修复（部分遮住的矢量路径整个删除 PR #4577，没用到的 Type 3 字形 PR #4579），`pdfcraft-cli audit` 找"假密文"。
- 加密：README 写支持 RC4 40 位到 AES-256、Unicode 密码、遵守作者权限；0.16.1 起加密用系统的安全随机数（PR #4013）。
- 脚本和链接：`crates/js` 是没有文件、网络、定时器的沙箱；文档里的网页和邮件链接先问用户，其他地址拒绝（`crates/ui-egui/src/app/links.rs`）。

**V 阶段用 `tools/scan-leaks.mjs`**：存出的文件放 `outputs/`，名字用探针名加 `.pdfcraft.pdf`，例如 `outputs/SC-RED-01.pdfcraft.pdf`，然后：

```sh
node tools/scan-leaks.mjs runs/<本批>/outputs/SC-RED-01.pdfcraft.pdf --keep > runs/<本批>/evidence/SC-RED-01-V-scan.txt
```

脚本按 `corpus/generated/manifest.json` 里这个探针的 `secrets` 搜索，`--keep` 同时确认 `GPCKEEP` 标记还在。找到任何 secret 就是 `fail` 加 `leak`，并按 README §9 私下报告。另外跑 `qpdf --check` 和 `pdftotext`，输出一起存进 evidence。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| SC-RED-01 | P0 | Mac Win | E S A V | G | 密文：一行文字 | `SC-RED-01.pdf`：在第 1 页红框里标记密文，应用，保存。A：Acrobat 里那一行变成黑块，上下两行 GPCKEEP 还在，复制黑块区域得不到文字；V：第 1 页的标记找不到，第 2 页的副本还在（scan 会报告 GPCSECRET-TEXT-0001 仍在文件里——第 2 页没处理是对的，note 写明；接着再对第 2 页做一次，再扫一次应完全找不到） |
| SC-RED-02 | P0 | Mac Win | E S V | G | 密文：共享的表单 XObject | `SC-RED-02.pdf`：只在第 1 页红框里做。用 `pdftotext -f 1 -l 1` 和 `-f 2 -l 2` 分别提取：第 1 页没有标记，第 2 页还有。scan 会报告仍在文件里（第 2 页需要它），note 写 |
| SC-RED-03 | P0 | Mac Win | E S A V | G | 密文：部分遮住的矢量图 | `SC-RED-03.pdf`：红框只盖住曲线的一部分。A：0.15.0 起整条曲线都消失，框外的部分也一起没了（这是上游的设计，note 写看到的样子）；V：曲线坐标 151.731 等都找不到 |
| SC-RED-04 | P0 | Mac Win | E S V | G | 密文：图片的一部分 | `SC-RED-04.pdf`：红框盖住棋盘格。V：`pdfimages -png <输出> evidence/SC-RED-04-img`，打开导出的图片，棋盘格那块被清掉，其余部分还在。scan 不适用（文字标记不在图片里） |
| SC-RED-05 | P1 | Mac Win | E S V | G | 密文：Type 3 字体 | `SC-RED-05.pdf`：红框里的字是 Type 3 字体画的。V：13.579 等字形坐标找不到（0.15.0 起删除不再使用的字形程序） |
| SC-RED-06 | P0 | Mac Win | E S V | G | 查找文字并密文 | `SC-RED-06.pdf`：用「查找文本并密文」搜 GPCSECRET-FIND，应找到 6 处；再用电子邮件和电话号码的模式。全部应用，保存。V：找不到任何 secret，GPCKEEP-FIND-0001 还在。note 写模式漏掉或多标了哪些 |
| SC-RED-07 | P0 | Mac Win | T V | G | 识别假密文 | 对 `SC-RED-07.pdf` 运行 `pdfcraft-cli audit SC-RED-07.pdf`：应报告两处（黑框和白框），退出码非 0；再对 SC-RED-01 的结果运行一次：应通过。输出存进 evidence |
| SC-RED-08 | P1 | Mac Win | E S A V | G | 密文：框下的注释和表单字段 | `SC-RED-08.pdf`：红框盖住一个便笺和一个文本框。A：两者都没了，框外的蓝色便笺还在；V：GPCSECRET-ANNOT/FIELD 找不到，GPCKEEP-ANNOT 还在 |
| SC-RED-09 | P1 | Mac Win | E | G | 密文前的预览和撤销 | 在 `SC-RED-01.pdf` 标记后、应用前，标记能看到、能改大小、能删除；应用后能撤销，撤销后文字回来；再应用、保存 |
| SC-SAN-01 | P0 | Mac Win | E S V | G | 清理文档 | `SC-SAN-01.pdf`：「清理文档」，保存。V：manifest 里的 secret 是前缀 GPCSECRET-，任何一个都不该在：文档信息、XMP、附件和附件名、隐藏图层、隐形文字、页面外文字、打开时运行的脚本、书签、链接、私有数据。GPCKEEP-BODY-0001 要还在。scan 报告里每一条都抄进 note |
| SC-HID-01 | P1 | Mac Win | E S V | G | 删除隐藏信息（只选几类） | `SC-SAN-01.pdf` 的副本：「删除隐藏信息」只勾选元数据和附件。V：这两类没了，其余几类还在（说明是按选择删的） |
| SC-INC-01 | P0 | Mac Win | E S V | G | 普通保存留下了什么 | `SC-INC-01.pdf`：把第 1 页的 GPCSECRET-EDIT-0001 那行改成别的字，**保存**（不是另存为）。V：scan 应找到 GPCSECRET-EDIT-0001——这是追加保存的正常结果，`pass` 的标准是"和上游说明一致"，note 写文件里有几个修订版本。然后**另存为**一个新文件，再扫：应找不到 |
| SC-INC-02 | P0 | Mac Win | E S V | G | 删除页面后保存 | `SC-INC-01.pdf` 的新副本：删除第 2 页，保存。V：0.17.0 起 GPCSECRET-PAGE2-0001 找不到，GPCKEEP-PAGE3-0001 还在 |
| SC-INC-03 | P1 | Mac Win | E S V | G | 已签名的文件里删除页面 | 先按 FM-SIG-01 对 `SC-INC-01.pdf` 签名，再删除第 2 页，保存。上游的设计是有签名的文件仍追加保存（签名才不会失效），所以 GPCSECRET-PAGE2-0001 应该还在文件里；note 写 PdfCraft 有没有提示这一点 |
| SC-ENC-01 | P0 | Mac Win | O D | G | 打开各种加密 | 六个 `SC-ENC-*.pdf`，密码见 README §3.4。每个都能用打开密码打开、显示正确；Unicode 密码能输入；`SC-ENC-OWNER-ONLY.pdf` 不用密码就能打开 |
| SC-ENC-02 | P0 | Mac Win | E S A V | G | 用密码保护 | `SC-ENC-SRC.pdf`：「使用密码保护」，打开密码 `gpc-open-1`，AES-256，保存。A：Acrobat Reader 要密码，输对能打开；V：`qpdf --show-encryption --password=gpc-open-1 <输出>` 的结果存进 evidence；scan 找不到 GPCENC-PLAIN-0001（明文不该出现在加密文件里） |
| SC-ENC-03 | P1 | Mac Win | E S A V | G | 改加密文件后保存 | `SC-ENC-AES-256.pdf`：加一个注释，保存。A：仍然要原来的密码；V：scan 找不到 GPCENC-PLAIN-0001 |
| SC-PERM-01 | P1 | Mac Win | O T | G | 权限限制 | `SC-ENC-OWNER-ONLY.pdf`：PdfCraft 应提示有限制，并且不允许打印、复制、修改、批注（逐个试，note 写每项实际表现）；输入所有者密码 owner-only 后限制解除 |
| SC-JS-01 | P0 | Mac Win | T | G | 链接和脚本 | `SC-JS-01.pdf` 九个框逐个点。网页和邮件：先询问再打开；file: 地址和启动程序：拒绝并提示，计算器不会打开；脚本打开网页：先询问；提交表单：note 写发生了什么（不能不问就发）。同时开着网络监控（IN-NET-01 的工具），记下有没有任何连接 |
| SC-JS-02 | P1 | Mac Win | T | G | 死循环脚本 | `SC-JS-01.pdf` 第 9 个框：PdfCraft 应在有限时间内停下脚本，界面不卡死。记下用了多少秒、有没有提示 |
| SC-LOG-01 | P1 | Mac Win | T | G | 日志里有没有密码 | 用密码打开 `SC-ENC-UNICODE.pdf` 和 `SC-ENC-AES-256.pdf` 后退出，在日志里搜 `user256` 和 `pässwörd`：应该找不到（`grep -c`，输出存进 evidence） |
