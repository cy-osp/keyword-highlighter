# HighlightWordsInPdf

## 介绍

`HighlightWordsInPdf` 是一个用于在 PDF.js 渲染的 PDF 页面上高亮指定关键词的 JavaScript 类。该类通过解析 PDF 页面上的文本层并计算关键词位置，实现精准的文本高亮。

## 功能特性

- **支持跨标签文案高亮**：即使关键词跨越多个文本节点，依然能够正确识别并高亮。
- **支持正则表达式**：可以使用正则表达式匹配关键词。
- **适用于 PDF.js 渲染的 PDF 文件**：可直接与 PDF.js 生成的 `textLayer` 和 `canvasWrapper` 结合使用。
- **基于 Canvas 绘制高亮**：通过在 PDF 页面上的 Canvas 层绘制高亮区域，实现无侵入式高亮。
- **自动计算文本位置**：解析 PDF 文本层，准确计算高亮区域。

## 安装与使用

### 引入

该类为 ES6 模块，可以直接引入使用：

```javascript
import HighlightWordsInPdf from './HighlightWordsInPdf.js';
```

### 示例代码（适用于 PDF.js 渲染的 PDF 页面）

```javascript
// 假设 PDF.js 渲染的 PDF 页面已经加载，并且 textLayer 已经可用
const pdfPageDom = document.getElementById('pdf-page');
const highlightList = [
    { word: 'JavaScript' },
    { word: '高亮' },
    { isReg: true, reg: /匹配/g }
];

const highlighter = new HighlightWordsInPdf();
highlighter.setPageDomHighlight(pdfPageDom, highlightList);
```

### 在 PDF.js 中的集成示例（伪代码）

如果你的项目使用 PDF.js 加载 PDF 文件，任意的渲染方法，在 textLayer 之后调用 `HighlightWordsInPdf` 进行高亮即可：

```javascript
pdfjsLib.getDocument('example.pdf').promise.then(pdf => {
    pdf.getPage(1).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        page.render({ canvasContext: ctx, viewport }).promise.then(() => {
            return page.getTextContent();
        }).then(textContent => {
            const textLayer = document.getElementById('pdf-text-layer');
            pdfjsLib.renderTextLayer({
                textContent,
                container: textLayer,
                viewport,
                textDivs: []
            }).promise.then(() => {
                const highlighter = new HighlightWordsInPdf();
                highlighter.setPageDomHighlight(textLayer.parentElement, [
                    { word: '示例' },
                    { isReg: true, reg: /PDF/g }
                ]);
            });
        });
    });
});
```

## 方法说明

### `setPageDomHighlight(pageDom, highlightList)`

- 参数

  ：

  - `pageDom`：PDF 页面对应的 DOM 元素。
  - `highlightList`：关键词列表，可以是字符串或正则表达式。

- **功能**：在 PDF 页面上高亮指定关键词。

### 私有方法（内部实现）

- `#getHighlightWords(containerDom, highlightList)`: 获取所有需要高亮的关键词。
- `#getHighlightWordPosition(innerText, highlightWordList)`: 计算关键词在文本中的位置。
- `#getNodeTextListAndPureText(node, list, pureText)`: 解析 PDF 文本层，构建文本节点映射。
- `#getRangeByPosition(position)`: 根据文本索引范围获取对应的 `Range`。
- `#getRange(anchorNode, anchorOffset, focusNode, focusOffset)`: 创建 `Range` 对象。

## 代码结构

- **高亮匹配**：解析文本内容，计算匹配关键词的位置。
- **支持跨标签高亮**：即使文本被多个节点分割，也能正确匹配。
- **适用于 PDF.js**：兼容 PDF.js 生成的 `textLayer` 和 `canvasWrapper`。
- **Canvas 绘制**：利用 `fillRect` 在 PDF 画布上绘制高亮区域。
- **性能优化**：减少不必要的 `DOM` 操作，提高渲染性能。

## 兼容性

该类基于原生 JavaScript 和 PDF.js，支持现代浏览器（Chrome、Firefox、Edge、Safari）。

## 贡献

欢迎提出 issue 和 PR 进行改进。

## 许可证

MIT License