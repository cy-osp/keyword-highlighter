# Keyword Highlighter

Highlight keywords in **HTML DOM** and in **PDF.js-rendered PDF** pages — even when the keyword is split across multiple tags or text nodes.

**Keyword Highlighter** is a dependency-free JavaScript library with two ES6 classes:

- `HighlightWordsInDom` — highlights keywords inside any HTML element and returns the highlighted `innerHTML`.
- `HighlightWordsInPdf` — highlights keywords on PDF pages rendered with [PDF.js](https://mozilla.github.io/pdf.js/), by drawing translucent rectangles onto the canvas layer.

The killer feature: **cross-tag matching**. Search terms like `JavaScript` split into `<span>Java</span><span>Script</span>` by rich-text editors, syntax highlighters or diff tools are still found and highlighted correctly — something `String.replace` and most naive highlighters cannot do.

## Features

- ✅ **Cross-tag / cross-node matching** — keywords spanning multiple HTML tags or PDF text nodes are matched and highlighted
- ✅ **Regex keywords** — mix literal words and regular expressions in the same highlight list
- ✅ **Multiple keywords at once** — highlight a whole list in a single pass
- ✅ **Structure-preserving (HTML)** — only text is wrapped; the original DOM/HTML structure is kept
- ✅ **Canvas-based (PDF)** — highlights are drawn on PDF.js's canvas layer, leaving the text layer untouched and selectable
- ✅ **Zero dependencies** — pure ES6, works with Vue / React / plain JS

## Install

Copy the folder you need into your project:

```javascript
import HighlightWordsInDom from './highlightWordsInHtml/index.js';
import HighlightWordsInPdf from './highlightWordsInPdf/index.js';
```

## Usage — highlight keywords in HTML

```javascript
const containerDom = document.getElementById('content');
const highlightList = [
  { word: 'JavaScript' },
  { word: 'highlight' },
  { isReg: true, reg: /match[a-z]*/g }   // regex keyword
];

const highlighter = new HighlightWordsInDom();
containerDom.innerHTML = highlighter.getHighlightInnerHTML(containerDom, highlightList);
```

Matched text is wrapped in `<i class="red-highlight">…</i>` — style it however you like:

```css
.red-highlight { color: #fff; background: #e74c3c; font-style: normal; }
```

## Usage — highlight keywords in PDF.js pages

Call it right after PDF.js finishes rendering the page (`pageDom` is the element containing PDF.js's `.textLayer` and `.canvasWrapper`):

```javascript
const pdfPageDom = document.getElementById('pdf-page');
const highlighter = new HighlightWordsInPdf();
highlighter.setPageDomHighlight(pdfPageDom, [
  { word: 'invoice' },
  { isReg: true, reg: /2026-\d{4}/g }
]);
```

It reads the rendered `.textLayer`, locates every match in the page's text, converts matches to DOM `Range` objects and paints them onto the canvas — so existing PDF search highlighting, text selection and zoom keep working.

## API

### `HighlightWordsInDom#getHighlightInnerHTML(containerDom, highlightList)`

| Parameter     | Type        | Description                                    |
| ------------- | ----------- | ---------------------------------------------- |
| `containerDom`| `Element`   | The HTML element whose text gets highlighted.  |
| `highlightList`| `Array`    | Items of `{ word: '…' }` or `{ isReg: true, reg: /…/g }`. |

Returns the processed `innerHTML` string.

### `HighlightWordsInPdf#setPageDomHighlight(pageDom, highlightList)`

| Parameter     | Type        | Description                                                        |
| ------------- | ----------- | ------------------------------------------------------------------ |
| `pageDom`     | `Element`   | PDF page container with `.textLayer` and `.canvasWrapper` children. |
| `highlightList`| `Array`   | Same item format as above.                                         |

Draws highlights directly onto the canvas.

## Browser support

Pure ES6 + standard DOM APIs (`Range`, `Canvas 2D`). Works in all modern browsers: Chrome, Edge, Firefox, Safari.

## Use cases

- In-app search & keyword highlighting in rich text / document viewers
- Search-result highlighting inside PDF viewers built on PDF.js
- Contract / invoice / report annotation tools
- Reading-mode and text analysis extensions

## License

[MIT](./LICENSE) © 2026 yixiaocao33
