export default class HighlightWordsInPdf {
	#nodeTextList = [];

	setPageDomHighlight(pageDom, highlightList,) {
		const textDom = pageDom.querySelector('.textLayer');
		const canvas = pageDom.querySelector('.canvasWrapper').firstChild;
		const canvasContext = canvas.getContext('2d');
		const highlightWordList = this.#getHighlightWords(textDom, highlightList);
		const { list,pureText } = this.#getNodeTextListAndPureText(textDom, [],'');
		this.#nodeTextList = list;
		
		const positionList = this.#getHighlightWordPosition(pureText, highlightWordList);
		
		positionList.forEach(item => {
			const range = this.#getRangeByPosition(item);
			if (range) {
				const textRect = textDom.getBoundingClientRect();
				const clientRectList = range.getClientRects();
				for (let i = 0; i < clientRectList.length; i++) {
					const rect = clientRectList[i];
					const { width, height } = rect;
					const x = Math.abs(textRect.x - rect.x);
					const y = Math.abs(textRect.y - rect.y);
					canvasContext.fillStyle = 'rgba(255, 0, 0,.5)'; // 半透明黄色
					canvasContext.fillRect(x, y, width, height);
				}

			}
		})
	}

	#escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
	#getHighlightWordPosition(innerText, highlightWordList) {
		let position = [];
		highlightWordList.forEach(str => {
			const regex = new RegExp(this.#escapeRegExp(str), 'g');
			let match;
			while ((match = regex.exec(innerText)) !== null) {
				position.push({
					startIndex: match.index,
					endIndex: match.index + str.length
				})
				regex.lastIndex = match.index + 1;
			}
		})
		
		return position;
	}
	#getHighlightWords(containerDom, highlightList) {
		let highlightWords = [];
		const innerText = containerDom.innerText.replace(/(\t|\n)/g,'');
		for (let i = 0; i < highlightList.length; i++) {
			const { word, isReg, reg } = highlightList[i];
			if (isReg) {
				const words = innerText.match(reg);
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
	#getNodeTextListAndPureText(node, list,pureText) {
		if (node.childNodes.length > 0) {
			node.childNodes.forEach(childNode => {
				const childRes = this.#getNodeTextListAndPureText(childNode, [],'');
				list = list.concat(childRes.list);
				pureText += childRes.pureText;
			})
		} else if (!/^\s+$/.test(node.nodeValue || '')) {//去除空白文本的影响
			const allText = node.textContent || '';
			const text = allText.replace(/(\t|\n)/g, '');
			pureText += text;
			list.push({ node, text, allText });
		}
		return { list,pureText };
	}

	#getRangeByPosition(position) {
		const { startIndex, endIndex } = position;
		const nodeTextList = this.#nodeTextList;
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
			} else if(endIndex === len && i === nodeTextList.length-1){
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
		}
		
	}
}
