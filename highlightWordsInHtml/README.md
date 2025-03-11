# HighlightWordsInDom

## 介绍

`HighlightWordsInDom` 是一个用于在 DOM 文本中高亮指定关键词的 JavaScript 类。通过遍历文本节点并匹配关键词，该类能够动态修改 HTML 结构，在匹配的关键词上添加特定的高亮标记。

## 功能特性

- **精准匹配**：支持完整匹配和部分匹配关键词。
- **支持正则表达式**：可以使用正则表达式匹配关键词。
- **支持跨标签文案高亮**：即使关键词跨越多个 HTML 标签，依然能够正确识别并高亮。
- **多关键词支持**：可以同时高亮多个关键词。
- **HTML 解析**：保留 HTML 结构，仅修改文本部分。

## 安装与使用

### 引入

该类为 ES6 模块，可以直接引入使用：

```javascript
import HighlightWordsInDom from './HighlightWordsInDom.js';
```

### 示例代码

```javascript
const containerDom = document.getElementById('content');
const highlightList = [
    { word: 'JavaScript' },
    { word: '高亮' },
    { isReg: true, reg: /匹配/g }
];

const highlighter = new HighlightWordsInDom();
const resultHTML = highlighter.getHighlightInnerHTML(containerDom, highlightList);
containerDom.innerHTML = resultHTML;
```

## 方法说明

### `getHighlightInnerHTML(containerDom, highlightList)`

- **参数**：
  - `containerDom`：包含文本内容的 DOM 元素。
  - `highlightList`：关键词列表，可以是字符串或正则表达式。
- **返回值**：处理后的 HTML 字符串。

### 私有方法（内部实现）

- `#getTextNodesFromTextLayer(domNode)`: 提取文本节点。
- `#isMatching(textNodes, nIdx, highlightWord, isRemain)`: 判断是否匹配关键词。
- `#jointTextNodes(textNodes)`: 重新拼接处理后的文本。
- `#escapeRegExp(string)`: 处理正则表达式特殊字符。
- `#getHighlightWords(containerDom, highlightList)`: 获取所有需要高亮的关键词。

## 代码结构

- **高亮匹配**：遍历文本节点，查找匹配的关键词，并替换成高亮的 HTML 片段。
- **支持跨标签高亮**：即使文本被 HTML 标签分割，也能正确匹配并高亮。
- **DOM 操作**：使用 `innerHTML` 重新注入处理后的内容。
- **性能优化**：减少 DOM 变更，提高渲染性能。

## 兼容性

该类基于原生 JavaScript，支持现代浏览器（Chrome、Firefox、Edge、Safari）。

## 贡献

欢迎提出 issue 和 PR 进行改进。

## 许可证

MIT License

