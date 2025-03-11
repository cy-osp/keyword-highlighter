export default class HighlightWordsInDom {

	getHighlightInnerHTML(containerDom,highlightList){
        if((highlightList || []).length === 0) return;
		let textNodes = this.#getTextNodesFromTextLayer(containerDom);
		const tempContainerDom = document.createElement('div');
		const highlightWords = this.#getHighlightWords(containerDom,highlightList);
		
		const nLen = textNodes.length;
		for(let i=0;i<highlightWords.length;i++){
			const word = highlightWords[i];
			let tempNodes = [];
			let j =0;
			while(j < nLen){
				const matchedNodes = this.#isMatching(textNodes,j,word);
				if(matchedNodes.length === 0){
					tempNodes.push(textNodes[j]);
					j++;
				}else{
					j = matchedNodes[matchedNodes.length - 1].nodeIdx + 1;
					for(let k=0;k<matchedNodes.length;k++){
						const { nodeIdx,configList } = matchedNodes[k];
						const { firstPart,textContent } = textNodes[nodeIdx];
						let strArr = Array.from(textContent),emptyIdx = 0;						
						for(let l=0;l<configList.length;l++){
							const { idx,word } = configList[l];
							strArr.splice(idx - emptyIdx,word.length,`<i class="red-highlight">${word}</i>`);
							emptyIdx += word.length - 1;
						}
						tempNodes.push({
							firstPart,textContent,
							highlightTextNode:strArr.join('')
						});
					}
				}
			}
			
			const highlightInnerHTML = this.#jointTextNodes(tempNodes);
			// 通过重新塞入dom元素，保证拼接的innerHTML完整
			tempContainerDom.innerHTML = highlightInnerHTML;
			textNodes = this.#getTextNodesFromTextLayer(tempContainerDom);

		}
		return tempContainerDom.innerHTML;
	}

	#escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
	#isMatching(textNodes,nIdx,highlightWord,isRemain){
		let matchedNodes = [];
		const { textContent } = textNodes[nIdx];
		const tLen = textContent.length,hLen = highlightWord.length;
		if(isRemain){
			if(hLen <= tLen){
				if(textContent.indexOf(highlightWord) === 0){
					matchedNodes.push({
						nodeIdx:nIdx,
						configList:[{ idx:0,word:highlightWord }]
					});
				}
			}else{
				if(highlightWord.indexOf(textContent) === 0){
					const lastHighlightWord = highlightWord.slice(tLen);
					const remainMatchedNodes = this.#isMatching(textNodes,nIdx+1,lastHighlightWord,true);	
					if(remainMatchedNodes.length){
						matchedNodes.push({
							nodeIdx:nIdx,
							configList:[{ idx:0,word:textContent }]
						})
						matchedNodes = matchedNodes.concat(remainMatchedNodes);
					}
				}
			}
		}else{
			const regex = new RegExp(this.#escapeRegExp(highlightWord), 'g');
			let match,configList = [];
			while ((match = regex.exec(textContent)) !== null) {
				configList.push({
					idx:match.index,
					word:highlightWord
				});
				regex.lastIndex = match.index + 1;
			}

			let i = 0,repeatStr = '',prefix='',suffix='';
			const minLen = Math.min(hLen,tLen);
			while(i<minLen+1){
				i++;
				prefix = highlightWord.substring(0,i);
				suffix = textContent.slice(-i);
				if(prefix === suffix){
					repeatStr = prefix;
				}
				
			}
			let remainMatchedNodes = [];
			if(repeatStr){
				const idx = tLen - repeatStr.length;
				if(!configList.length || configList[configList.length-1]?.idx !== idx){
					const lastHighlightWord = highlightWord.slice(repeatStr.length);
					remainMatchedNodes = this.#isMatching(textNodes,nIdx+1,lastHighlightWord,true);
					
					if(remainMatchedNodes.length){
						configList.push({ idx,word:repeatStr });
					}
				}
			}
			if(configList.length){
				matchedNodes.push({
					nodeIdx:nIdx,
					configList
				});
				matchedNodes = matchedNodes.concat(remainMatchedNodes);
			}
		}

		return matchedNodes;
	}

	#getHighlightWords(containerDom,highlightList){
		let highlightWords = [];
		const innerText = containerDom.innerText.replace(/\n/g,'').replace(/\t/g,'');
		for(let i=0;i<highlightList.length;i++){
			const { word,isReg,reg } = highlightList[i];
			if(isReg){
				const words = innerText.match(reg);
				if(words){
					highlightWords = highlightWords.concat(words);
				}
			}else{
				highlightWords.push(word);
			}
		}
		
		return [...new Set(highlightWords)];
	}
	#findFirstNonTagSpace(currentHTML){
		let inTag = false;
    for (let i = 0; i < currentHTML.length; i++) {
			if (currentHTML[i] === '<') {
				inTag = true;
			} else if (currentHTML[i] === '>') {
				inTag = false;
			} else if (!inTag && currentHTML[i] === ' ') {
				// 找到了第一个不在标签内的空格
				return i;
			}
    }
    // 如果没有找到符合条件的空格
    return -1;
	}
	#getTextNodesFromTextLayer(domNode) {
		const result = []; // 存储结果
		let currentHTML = domNode.innerHTML; // 当前处理的innerHTML

		// 利用textarea的 DOM 解析能力自动解码实体字符，否则实体字符与textContent 之间存在差异
		const textarea = document.createElement('textarea');
		textarea.innerHTML = currentHTML;
		currentHTML = textarea.value;
		const that = this;
		// 递归遍历DOM节点
		function traverse(node) {
			if (node.nodeType === Node.TEXT_NODE) { // 如果是文本节点
				const textContent = node.textContent; // 获取文案
				
				const startIndex = textContent === ' ' ? that.#findFirstNonTagSpace(currentHTML): currentHTML.indexOf(textContent);
				const endIndex = startIndex + textContent.length; // 获取文案在innerHTML中的结束位置
				// 记录文案及其前后部分
				result.push({
					firstPart: currentHTML.substring(0, startIndex), // 获取firstPart
					textContent: textContent,
				});
				// 更新currentHTML，去掉已处理的部分
				currentHTML = currentHTML.substring(endIndex);
			} else if (node.nodeType === Node.ELEMENT_NODE) { // 如果是元素节点
				// 遍历子节点
				Array.from(node.childNodes).forEach(child => traverse(child));
			}
		}
		// 开始遍历
		traverse(domNode);

		// 处理空文案的情况
		if (currentHTML) {
			result.push({
				firstPart: currentHTML, // firstPart为剩余的innerHTML
				textContent: '', // 文案为空
			});
		}

		return result;
	}


	#jointTextNodes(textNodes) {
		let innerHTML = '';
		for(let i = 0; i < textNodes.length; i++){
			const { firstPart,textContent,highlightTextNode } = textNodes[i];
			innerHTML += firstPart + (highlightTextNode || textContent);
		}
		return innerHTML;
	}
}