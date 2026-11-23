const DEFAULT_HIGHLIGHT_CLASS = 'red-highlight';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default class HighlightWordsInDom {
  /**
   * @param {Element} containerDom - the element whose text gets highlighted
   * @param {Array<{word?: string, isReg?: boolean, reg?: RegExp}>} highlightList
   * @param {{highlightClass?: string}} [options]
   * @returns {string} the highlighted innerHTML
   */
  getHighlightInnerHTML(containerDom, highlightList, options = {}) {
    const highlightClass = options.highlightClass || DEFAULT_HIGHLIGHT_CLASS;
    const originalHTML = containerDom.innerHTML;
    if ((highlightList || []).length === 0 || !originalHTML) return originalHTML;

    let textNodes = this.#getTextNodesFromTextLayer(containerDom);
    const highlightWords = this.#getHighlightWords(textNodes, highlightList);
    if (highlightWords.length === 0) return originalHTML;

    const nLen = textNodes.length;
    for (let i = 0; i < highlightWords.length; i++) {
      const word = highlightWords[i];
      let tempNodes = [];
      let j = 0;
      while (j < nLen) {
        const matchedNodes = this.#isMatching(textNodes, j, word);
        if (matchedNodes.length === 0) {
          tempNodes.push(textNodes[j]);
          j++;
        } else {
          j = matchedNodes[matchedNodes.length - 1].nodeIdx + 1;
          for (let k = 0; k < matchedNodes.length; k++) {
            const { nodeIdx, configList } = matchedNodes[k];
            const { firstPart, textContent } = textNodes[nodeIdx];
            tempNodes.push({
              firstPart,
              textContent,
              highlightTextNode: this.#wrapMatches(textContent, configList, highlightClass)
            });
          }
        }
      }

      const highlightInnerHTML = this.#jointTextNodes(tempNodes);
      // Re-parse so the next keyword matches against the updated structure
      const tempContainerDom = document.createElement('div');
      tempContainerDom.innerHTML = highlightInnerHTML;
      textNodes = this.#getTextNodesFromTextLayer(tempContainerDom);
    }

    return this.#jointTextNodes(textNodes);
  }

  /**
   * Build the HTML for one text node: escape every segment and wrap matched
   * words in the highlight tag. Escaping here is what keeps text like
   * "a < b" from being re-interpreted as markup.
   */
  #wrapMatches(textContent, configList, highlightClass) {
    let out = '';
    let pos = 0;
    for (const { idx, word } of configList) {
      out += escapeHtml(textContent.slice(pos, idx));
      out += `<i class="${highlightClass}">${escapeHtml(word)}</i>`;
      pos = idx + word.length;
    }
    return out + escapeHtml(textContent.slice(pos));
  }

  #escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /*
    完整高亮
      1、完全包含，考虑有多个匹配
      2、部分包含，高亮词前缀和文案后缀重复，获取剩余高亮词，下个节点匹配，如果有剩余高亮词下个节点不匹配的话，清除所有匹配
      3、不匹配
  **/
  /*
    剩余高亮词匹配
      1、剩余高亮词汇长度等于节点文案长度，高亮词汇和节点文案要相等，下标必须为0，
      2、剩余高亮词汇长度小于节点文案长度，下标必须为0，
      3、剩余高亮词汇长度大于节点文案长度，节点文案在剩余高亮文案的下标为0，获取剩余高亮词汇，下个节点匹配，如果有剩余高亮词下个节点不匹配的话，清除所有匹配
      4、如果都不匹配，清除所有匹配
  */
  #isMatching(textNodes, nIdx, highlightWord, isRemain) {
    // Out-of-range or empty text nodes (produced by trailing markup) can never
    // match a remaining word — without this guard the isRemain recursion
    // would read past the array and crash.
    if (nIdx >= textNodes.length || textNodes[nIdx].textContent.length === 0) {
      return [];
    }
    let matchedNodes = [];
    const { textContent } = textNodes[nIdx];
    const tLen = textContent.length, hLen = highlightWord.length;
    if (isRemain) {
      if (hLen <= tLen) {
        if (textContent.indexOf(highlightWord) === 0) {
          matchedNodes.push({
            nodeIdx: nIdx,
            configList: [{ idx: 0, word: highlightWord }]
          });
        }
      } else {
        if (highlightWord.indexOf(textContent) === 0) {
          const lastHighlightWord = highlightWord.slice(tLen);
          const remainMatchedNodes = this.#isMatching(textNodes, nIdx + 1, lastHighlightWord, true);
          if (remainMatchedNodes.length) {
            matchedNodes.push({
              nodeIdx: nIdx,
              configList: [{ idx: 0, word: textContent }]
            });
            matchedNodes = matchedNodes.concat(remainMatchedNodes);
          }
        }
      }
    } else {
      const regex = new RegExp(this.#escapeRegExp(highlightWord), 'g');
      let match, configList = [];
      while ((match = regex.exec(textContent)) !== null) {
        configList.push({
          idx: match.index,
          word: highlightWord
        });
        regex.lastIndex = match.index + 1;
      }

      let i = 0, repeatStr = '', prefix = '', suffix = '';
      const minLen = Math.min(hLen, tLen);
      while (i < minLen + 1) {
        i++;
        prefix = highlightWord.substring(0, i);
        suffix = textContent.slice(-i);
        if (prefix === suffix) {
          repeatStr = prefix;
        }
      }
      let remainMatchedNodes = [];
      if (repeatStr) {
        const idx = tLen - repeatStr.length;
        if (!configList.length || configList[configList.length - 1]?.idx !== idx) {
          const lastHighlightWord = highlightWord.slice(repeatStr.length);
          remainMatchedNodes = this.#isMatching(textNodes, nIdx + 1, lastHighlightWord, true);

          if (remainMatchedNodes.length) {
            configList.push({ idx, word: repeatStr });
          }
        }
      }
      if (configList.length) {
        matchedNodes.push({
          nodeIdx: nIdx,
          configList
        });
        matchedNodes = matchedNodes.concat(remainMatchedNodes);
      }
    }

    return matchedNodes;
  }

  /**
   * Extract highlight keywords from the concatenated text of the text nodes
   * (not innerText), so extraction and matching always operate on the same
   * text — hidden-by-CSS nodes no longer cause inconsistent behavior.
   */
  #getHighlightWords(textNodes, highlightList) {
    let highlightWords = [];
    const pureText = textNodes.map((n) => n.textContent).join('');
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

  /**
   * Find the first occurrence of `text` in `html` that is NOT inside a tag.
   * Fixes the case where the text also appears in an earlier attribute,
   * e.g. `<img alt="foo">foo`.
   */
  #findTextStartOutsideTags(html, text) {
    let from = 0;
    while (true) {
      const idx = html.indexOf(text, from);
      if (idx === -1) return -1;
      if (!this.#isInsideTag(html, idx)) return idx;
      from = idx + 1;
    }
  }

  #isInsideTag(html, idx) {
    const open = html.lastIndexOf('<', idx - 1);
    if (open === -1) return false;
    const close = html.indexOf('>', open);
    return close === -1 || close >= idx;
  }

  #getTextNodesFromTextLayer(domNode) {
    const result = [];
    let currentHTML = domNode.innerHTML;

    // textarea 解码实体字符，保证与 textContent 一致
    const textarea = document.createElement('textarea');
    textarea.innerHTML = currentHTML;
    currentHTML = textarea.value;
    const that = this;

    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent;
        const startIndex = that.#findTextStartOutsideTags(currentHTML, textContent);
        const endIndex = startIndex + textContent.length;
        result.push({
          firstPart: currentHTML.substring(0, startIndex),
          textContent: textContent,
        });
        currentHTML = currentHTML.substring(endIndex);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach((child) => traverse(child));
      }
    }
    traverse(domNode);

    if (currentHTML) {
      result.push({
        firstPart: currentHTML,
        textContent: '',
      });
    }

    return result;
  }

  #jointTextNodes(textNodes) {
    let innerHTML = '';
    for (let i = 0; i < textNodes.length; i++) {
      const { firstPart, textContent, highlightTextNode } = textNodes[i];
      innerHTML += firstPart + (highlightTextNode !== undefined ? highlightTextNode : escapeHtml(textContent));
    }
    return innerHTML;
  }
}
