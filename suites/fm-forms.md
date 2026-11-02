# FM：表单和签名

回答"表单能不能填、存了以后 Acrobat 里还对吗，签名有效吗"。依据：README "Forms: every field with its current value … drawn the way their author designed them"，"filling and authoring forms (with sandboxed JavaScript)"，"basic digital signatures"；`docs/gaps.md` 第 10 号（不支持 PKCS #11、时间戳、在线吊销）和第 15 号（JavaScript 对象模型、提交、XFA 深度）；0.16.1 修了表单脚本提示框的标题和按钮、单选按钮、导出 CSV 的公式注入。

数字签名用自签名证书，在准备批里生成（recipes.md 的「测试用数字证书」），不要用真实身份的证书。

## 用例

| ID | 优先级 | 系统 | 阶段 | 来源 | 用例 | 怎么测、看什么 |
|---|---|---|---|---|---|---|
| FM-FILL-01 | P0 | Mac Win | O E S R A | G | 填写每种字段 | `FM-FORM.pdf`：姓名填中英文混合「张三 Zhang San」，多行文本三行，数量 3、单价 19.5（总价应显示 $58.50），日期 2026-11-03，勾选复选框，单选选 M，下拉选 Japan，列表选两项。A：Acrobat 里每个值都在、样子对、总价对；R：PdfCraft 重开一致 |
| FM-FILL-02 | P0 | Mac Win | O E S A | R | 填写真实的政府表格 | R-W9：填姓名、地址、勾选一个分类、填 SSN 格子（用假号码 123-45-6789）。A：Acrobat 里值都在、位置对 |
| FM-JS-01 | P1 | Mac Win | T | G | 格式和计算脚本 | `FM-FORM.pdf`：数量输入字母应被拒绝；单价显示 $ 和两位小数；改数量后总价跟着变；日期输入 11/03/2026 怎么处理（note 写） |
| FM-JS-02 | P1 | Mac Win | T | G | 脚本弹出的提示 | 点「Say hello」按钮：提示框标题是「Form script」，有图标和「确定」按钮（0.16.1 起保留标题、图标和按钮） |
| FM-MAKE-01 | P0 | Mac Win | E S A | G | 自己做表单 | 在 `FM-FLAT.pdf` 上用「准备表单」加：6 个文本框、2 个复选框、一组 3 个单选按钮、一个下拉列表、一个签名域；设 Tab 顺序。A：Acrobat Reader 里能按 Tab 顺序填写，保存后值还在 |
| FM-DET-01 | P1 | Mac Win | E | G | 自动识别字段 | 对 `FM-FLAT.pdf` 用「检测表单字段」：找到几个文本框、几个复选框（预期 6 个和 2 个），位置对不对 |
| FM-FS-01 | P0 | Mac Win | E S A | G | 填写与签名 | 在 `FM-FLAT.pdf` 上用「填写与签名」：在线上打字（含中文）、打勾、填日期、放签名（画一个）和姓名缩写，改文字颜色和字号（0.16.1 起）。A：Acrobat 里都在，位置对 |
| FM-DATA-01 | P1 | Mac Win | X | G | 导出和导入表单数据 | FM-FILL-01 的结果导出为 FDF、XFDF、XML、CSV，再导入到空白副本，值一致。CSV 用 Excel 或 Numbers 打开：`formula_like` 字段（=HYPERLINK…）显示为文字，不是可点的链接（0.16.1 起） |
| FM-FLAT-01 | P1 | Mac Win | E S A | G | 拼合表单 | FM-FILL-01 的结果「拼合表单字段」，保存。A：值成了页面内容，不能再改，外观一样 |
| FM-SIG-01 | P0 | Mac Win | E S A V | G | 用自己的证书签名 | 用测试证书（.p12）在 `FM-FORM.pdf` 的签名域签名，保存为新文件。A：Acrobat Reader 显示签名完整、文档未被修改（身份未知是正常的，因为是自签名）；V：`pdfsig` 输出存进 evidence |
| FM-SIG-02 | P1 | Mac Win | O T | R | 验证别人签的名 | R-SIGNED（公开的带数字签名的 PDF）：「验证所有签名」的结论和 Acrobat Reader 的一致吗（签名者、时间、是否修改过） |
| FM-SIG-03 | P1 | Mac Win | E S A | G | 签名后再修改 | 在 FM-SIG-01 的结果上加一个注释，保存。PdfCraft 和 Acrobat 都应显示"签名后有修改"，原签名本身仍有效 |
| FM-SIG-04 | P1 | Mac Win | E S A | G | 认证签名 | 用「认证（可见签名）」认证 `FM-FORM.pdf`，A：Acrobat 显示认证和允许的修改 |
| FM-XFA-01 | P2 | Mac Win | O D E | R | XFA 表单 | R-XFA。能打开、显示、填写一个字段并保存；Acrobat Reader 里值还在 |
