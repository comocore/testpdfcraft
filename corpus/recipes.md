# 手工制作的测试文件（A 类）

这些文件要用别的软件做，脚本做不出来。在准备批 `prep` 里做一次，存进 `corpus/made/`，做完记进 `baseline.yaml`（用的软件和版本）。

## AN-ACROBAT.pdf：在 Acrobat Reader 里加的批注

1. 用 Acrobat Reader 打开 `generated/AN-BASE.pdf`，另存为 `made/AN-ACROBAT.pdf`。
2. 在第 1 页加：一条便笺（写"Acrobat note"）并回复一次；高亮一行；划掉一个词；一个文本框（写"Acrobat 文本框，中文"）；一个矩形；一段手绘。
3. 在第 2 页加一个"已批准"图章。
4. 作者名用 Acrobat Reader 默认的，或者改成 "Tester"（首选项 › 一般 › 用户名），不要用自己的名字。
5. 保存。

## FM-ACROBAT.pdf：在 Acrobat Reader 里填好的表单

用 Acrobat Reader 打开 `generated/FM-FORM.pdf`，按 FM-FILL-01 的值填好，另存为 `made/FM-ACROBAT.pdf`。PdfCraft 打开它时，值和外观应该和 Acrobat 一样（FM-FILL-01 的 O、D 阶段可以对照）。

## CV-IMG-04.jpg、CV-IMG-05.gif

Mac 上用「预览」打开 `generated/CV-IMG-01.png`：文件 › 导出，格式 JPEG、品质最高，存为 `made/CV-IMG-04.jpg`；再导出为 GIF，存为 `made/CV-IMG-05.gif`。

## CV-SCAN-FR.png：带重音字母的扫描图（CV-OCR-02）

1. 在文本编辑里新建一页，字号 14，输入：`Déjà vu, naïve façade, Größe, Straße, été, über, ½ café crème.`，重复 10 行。
2. 文件 › 导出为 PDF，存为 `made/CV-SCAN-FR.pdf`。
3. `pdftoppm -r 200 -gray -png made/CV-SCAN-FR.pdf made/CV-SCAN-FR`，得到 `made/CV-SCAN-FR-1.png`。

## 测试用数字证书（FM-SIG）

用 OpenSSL 做一个自签名证书，名字写明是测试用的，不要用真实身份：

```sh
openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
  -subj "/CN=GetPdfCraft Test Signer/O=GetPdfCraft test corpus" \
  -keyout made/test-signer.key -out made/test-signer.crt
openssl pkcs12 -export -inkey made/test-signer.key -in made/test-signer.crt \
  -name "GetPdfCraft Test Signer" -out made/test-signer.p12 -passout pass:gpc-test
```

`.p12` 的密码是 `gpc-test`。私钥 `test-signer.key` 和 `test-signer.p12` 不提交（`.gitignore` 已排除），只提交 `test-signer.crt`，读者可以用它核对签名。
