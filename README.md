# Keyword Highlighter

[![CI](https://github.com/cy-osp/keyword-highlighter/actions/workflows/ci.yml/badge.svg)](https://github.com/cy-osp/keyword-highlighter/actions/workflows/ci.yml)

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

```bash
npm install keyword-highlight
```

Or copy the folder you need into your project — there are no runtime dependencies:

```javascript
import { HighlightWordsInDom, HighlightWordsInPdf } from 'keyword-highlight';
// or individually:
import HighlightWordsInDom from 'keyword-highlight/html';
import HighlightWordsInPdf from 'keyword-highlight/pdf';
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

Matched text is wrapped in `<i class="red-highlight">…</i>` by default — pass `options.highlightClass` to customize it:

```javascript
highlighter.getHighlightInnerHTML(containerDom, highlightList, { highlightClass: 'my-mark' });
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

Draws highlights directly onto the canvas. Pass `options.color` to change the highlight color (default `rgba(255, 0, 0, 0.5)`), and call `highlighter.clear(pageDom)` to remove all highlights. Re-apply highlights after every PDF.js re-render (zoom, resize), since re-rendering repaints the canvas.

## Development

```bash
npm install
npm test        # runs vitest (jsdom)
```

CI runs the test suite on Node 18 & 20 for every push via GitHub Actions.

## Browser support

Pure ES6 + standard DOM APIs (`Range`, `Canvas 2D`). Works in all modern browsers: Chrome, Edge, Firefox, Safari.

## Use cases

- In-app search & keyword highlighting in rich text / document viewers
- Search-result highlighting inside PDF viewers built on PDF.js
- Contract / invoice / report annotation tools
- Reading-mode and text analysis extensions

## License

[MIT](./LICENSE) © 2026 yixiaocao33
