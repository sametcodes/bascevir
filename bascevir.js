const linkCreator = {
	cambridge: (sl, tl, word) => `https://dictionary.cambridge.org/dictionary/${sl}-${tl}/${word}`, 
	tureng: (sl, tl, word) => `https://tureng.com/en/${sl}-${tl}/${word}`
}

const getWord = (sl, tl, q) => {
	q = q.replace(".", "").replace("?", "").replace(",", ",")
	return fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURI(q)}`)
  	.then(res => res.ok ? res.json() : res.text());
}

const createPopup = (id, word, text, x, y, clientWidth) => {
	let offsetX;
	let r = (x > clientWidth / 2 ? 1 : -1);
	if(r === 1){
		offsetX = clientWidth - 350 - x;
	}else{
		offsetX = 350-x;
	}

	const popup = document.createElement("div");
	popup.setAttribute("id", id)
	popup.style.top = y + "px";
	popup.style.left = x + "px";
	popup.style.width = "0px";
	popup.style.height = "0px";
	popup.style.position = "absolute";
	popup.style.zIndex = "5";
	popup.style.userSelect = "none";

	const box = document.createElement("div");
	box.setAttribute("class", "box");
	box.style.display = "inline";
	box.style.maxWidth = "300px";
	box.style.width = "max-content";
	box.style.position = "absolute";
	box.style.marginTop = "-5px";
	box.style.zIndex = "0";

	const link = document.createElement("a");
	link.href = `https://translate.google.com/#view=home&op=translate&sl=en&tl=tr&text=${word}`;
	link.target = "_blank";
	link.style.outline = "0"

	const content = document.createElement("span")
	content.setAttribute("class", "onetap-content")
	content.innerText = text;
	content.style.borderRadius = "5px 0px 0px 5px";
	content.style.padding = "10px 20px";
	content.style.backgroundColor = "#333";
	content.style.fontSize = "18px";
	content.style.font = "Open Sans";
	content.style.color = "#fff";
	content.style.display = "inline-block";

	link.appendChild(content);

	const removeButton = document.createElement("div");
	removeButton.onclick = _ => removeHighlight(document.querySelectorAll(`span.${id}`))
	removeButton.className = "highlight-remove-button";
	removeButton.style.position = "absolute";
	removeButton.style.height = "50%";
	removeButton.style.width = "20px";
	removeButton.style.top = "0";
	removeButton.style.right = "-20px";
	removeButton.style.textAlign = "center";
	removeButton.style.color = "#fff";
	removeButton.style.backgroundColor = "rgb(216, 76, 76)";
	removeButton.style.borderRadius = "0px 5px 0px 0px";
	removeButton.style.fontSize = "14px";

	const infoButton = document.createElement("div");
	infoButton.onclick = _ => goDictionary(id, word) 
	infoButton.className = "highlight-info-button";
	infoButton.style.position = "absolute";
	infoButton.style.height = "50%";
	infoButton.style.width = "20px";
	infoButton.style.top = "50%";
	infoButton.style.right = "-20px";
	infoButton.style.textAlign = "center";
	infoButton.style.color = "#fff";
	infoButton.style.backgroundColor = "rgb(0, 108, 255)";
	infoButton.style.borderRadius = "0px 0px 5px 0px";
	infoButton.style.fontSize = "14px";

	box.appendChild(link)
	box.appendChild(removeButton)
	box.appendChild(infoButton)

	popup.appendChild(box);
	document.body.appendChild(popup);

	box.style.left = (offsetX - (Number(r === -1) * box.clientWidth)) + "px";

	var draw = SVG().addTo(`#${id}`).size(offsetX, 16)
	draw.node.style.overflow = "visible";
	var line = draw.polyline([0, 0, 10 * r, 10, offsetX, 10]);
	line.stroke({ color: '#ccc', width: 3 }).fill("none");
}

const injectHighlight = (selection, id) => {
	let {anchorOffset: start, focusOffset: end} = selection;
	if(start > end){
		[start, end] = [end, start]
	}

	let parentElement = selection.anchorNode.parentElement;

	const highlight = Array.from(selection.anchorNode.textContent).map((_, key) => {
		if(key === start){
			return `<span class="${id} onetap-highlight" style="background-color: #b65656; color: #fff">${_}`
		}
		if(key === end){
			return `${_.trim("")}</span> `
		}
		return _;
	}).filter(Boolean).join("");

	parentElement.innerHTML = parentElement.innerHTML.replace(selection.anchorNode.textContent, highlight);

	let {top, left, width, height} = document.querySelector(`span.${id}`).getBoundingClientRect();
	if((left + window.pageXOffset + width) < document.body.clientWidth/2){
		width = 0;
	}

	const willRemoveHighlights = Array.from(document.querySelectorAll("span.onetap-highlight"))
	.filter(el => el.getBoundingClientRect().top === top)
	.filter(el => el.classList[0] !== id);

	removeHighlight(willRemoveHighlights);

	return { x: left + window.pageXOffset + width, y: top + window.pageYOffset + height - 5,  }
}

const removeHighlight = (nodes) => {
	for(let el of nodes){
		let parentElement = el.parentElement
		el.outerHTML = el.innerText;
		parentElement = parentElement.innerHTML.replace(/\n/gm, "")
		let div = document.querySelector(`div#${el.classList[0]}`);
		if(div){ div.remove() }
	}
}

const goDictionary = (id, word, sourcelang="english", targetlang="turkish") => {
	browser.storage.sync.get('activeDictId').then(value => {
		const activeDict = value.activeDictId;
		if(activeDict in linkCreator){
			const link = linkCreator[activeDict](sourcelang, targetlang, word)
			window.open(link, '_blank').focus();
			return;
		}
	})
}


document.addEventListener("click",  event => {
	if(!event.ctrlKey) {
		browser.storage.sync.get('permanentBoxesValue')
		.then(({permanentBoxesValue}) => {
			const exclude_classnames = ["onetap-content", "highlight-info-button"];
			if(!permanentBoxesValue && !Array.from(event.target.classList).some(_class => exclude_classnames.includes(_class))){
				removeHighlight(document.querySelectorAll('span.onetap-highlight'))				
			}
		})
		return
   	}

	const selection = window.getSelection();
	const word = selection.toString();
	if(!word){ return };

	const id = "h" + Math.random().toString(36).substring(7);
	const {x, y} = injectHighlight(selection, id)
	getWord("en", "tr", word).then(([[[meaning]]]) => {
		createPopup(id, word, meaning, x, y, document.body.clientWidth)
	}).catch(console.log)
});
