const DEFAULT_HIGHLIGHT_COLOR = 'rgba(255, 0, 0, 0.5)';

/**
 * Pure helper (exported for unit testing): find the [startIndex, endIndex)
 * position of every occurrence of every word in `text`.
 */
export function findMatches(text, wordList) {
  const positions = [];
  for (const str of wordList) {
    const regex = new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      positions.push({
        startIndex: match.index,
        endIndex: match.index + str.length
      });
      regex.lastIndex = match.index + 1;
    }
  }
  return positions;
}

export default class HighlightWordsInPdf {
  #savedImageData = null;

  /**
   * @param {Element} pageDom - PDF page container with `.textLayer` and `.canvasWrapper` children
   * @param {Array<{word?: string, isReg?: boolean, reg?: RegExp}>} highlightList
   * @param {{color?: string}} [options]
   */
  setPageDomHighlight(pageDom, highlightList, options = {}) {
    const color = options.color || DEFAULT_HIGHLIGHT_COLOR;
    const textDom = pageDom.querySelector('.textLayer');
    const canvas = pageDom.querySelector('.canvasWrapper').firstChild;
    const canvasContext = canvas.getContext('2d');

    // Snapshot the canvas once so clear() can restore the original rendering
    if (!this.#savedImageData) {
      this.#savedImageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    }

    const { list, pureText } = this.#getNodeTextListAndPureText(textDom, [], '');
    const highlightWordList = this.#getHighlightWords(pureText, highlightList);
    const positionList = findMatches(pureText, highlightWordList);

    // Convert CSS pixels to canvas bitmap pixels so highlights stay aligned
    // even when the canvas is scaled by CSS (devicePixelRatio, zoom, transform)
    const cssRect = canvas.getBoundingClientRect();
    const scaleX = cssRect.width ? canvas.width / cssRect.width : 1;
    const scaleY = cssRect.height ? canvas.height / cssRect.height : 1;
    const textRect = textDom.getBoundingClientRect();

    for (const item of positionList) {
      const range = this.#getRangeByPosition(item, list);
      if (!range) continue;
      const clientRectList = range.getClientRects();
      for (let i = 0; i < clientRectList.length; i++) {
        const rect = clientRectList[i];
        canvasContext.fillStyle = color;
        canvasContext.fillRect(
          (rect.x - textRect.x) * scaleX,
          (rect.y - textRect.y) * scaleY,
          rect.width * scaleX,
          rect.height * scaleY
        );
      }
    }
  }

  /**
   * Restore the canvas to the state before the first highlight was drawn.
   * Note: PDF.js re-renders the canvas on zoom/resize — call
   * setPageDomHighlight again after every re-render.
   */
  clear(pageDom) {
    if (!this.#savedImageData) return;
    const canvas = pageDom.querySelector('.canvasWrapper').firstChild;
    canvas.getContext('2d').putImageData(this.#savedImageData, 0, 0);
    this.#savedImageData = null;
  }

  #escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  #getHighlightWords(pureText, highlightList) {
    let highlightWords = [];
    for (let i = 0; i < highlightList.length; i++) {
      const { word, isReg, reg } = highlightList[i];
      if (isReg) {
        const words = pureText.match(reg);
        if (words) {
          highlightWords = highlightWords.concat(words);
        }
      } else {
        highlightWords.push(word);
      }
    }

    return [...new Set(highlightWords)];
  }

  // 生成自上而下的node节点和text的关系图谱
  #getNodeTextListAndPureText(node, list, pureText) {
    if (node.childNodes.length > 0) {
      node.childNodes.forEach((childNode) => {
        const childRes = this.#getNodeTextListAndPureText(childNode, [], '');
        list = list.concat(childRes.list);
        pureText += childRes.pureText;
      });
    } else if (!/^\s+$/.test(node.nodeValue || '')) { //去除空白文本的影响
      const allText = node.textContent || '';
      const text = allText.replace(/(\t|\n)/g, '');
      pureText += text;
      list.push({ node, text, allText });
    }
    return { list, pureText };
  }

  #getRangeByPosition(position, nodeTextList) {
    const { startIndex, endIndex } = position;
    let anchorNode, focusNode, anchorOffset, focusOffset, temp;
    let len = 0, i = 0, _len = 0, allLen = 0, emptyIndex = 0;

    while (len <= endIndex && i < nodeTextList.length) {
      temp = nodeTextList[i];
      allLen = (temp.node.textContent || '').length;
      len += temp.text.length;
      _len += allLen;
      if (startIndex + 1 <= len && !anchorNode) {
        anchorNode = temp.node;
        emptyIndex = (temp.node.textContent || '').indexOf(temp.text);
        anchorOffset = startIndex - (len - temp.text.length) + emptyIndex;
      }

      if (endIndex + 1 <= len && !focusNode) {
        focusNode = temp.node;
        emptyIndex = (temp.node.textContent || '').indexOf(temp.text);
        focusOffset = endIndex - (len - temp.text.length) + emptyIndex;
      } else if (endIndex === len && i === nodeTextList.length - 1) {
        focusNode = temp.node;
        emptyIndex = (temp.node.textContent || '').indexOf(temp.text);
        focusOffset = endIndex - (len - temp.text.length) + emptyIndex;
      }
      i++;
    }

    return this.#getRange(anchorNode, anchorOffset, focusNode, focusOffset);
  }

  #getRange(anchorNode, anchorOffset, focusNode, focusOffset) {
    try {
      const range = new Range();
      range.setStart(anchorNode, anchorOffset);
      range.setEnd(focusNode, focusOffset);
      return range;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
