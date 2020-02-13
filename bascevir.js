const linkCreator = {
	cambridge: (sl, tl, word) => `https://dictionary.cambridge.org/dictionary/${sl}-${tl}/${word}`,
	tureng: (sl, tl, word) => `https://tureng.com/en/${tl}-${sl}/${word}`
}

const getWord = (sl, tl, q) => {
  q = q.replace(/(\.|\?|,)/g, "");
	return fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURI(q)}`)
  	.then(res => res.ok ? res.json() : res.text());
}

const createPopup = (id, word, text, x, y, clientWidth) => {
	let offsetX = 350 - x;
  let r = x > (clientWidth / 2) ? 1 : -1;
  if (r === 1) {
    offsetX = clientWidth - offsetX;
  }

  const popup = document.createElement("div");
  popup.setAttribute("id", id);
  popup.setAttribute("style",`
    top:${y}px;
    left:${y}px;
    width:0px;
    height:0px;
    position:absolute;
    z-index:5;
    user-select:none;`);

  const box = document.createElement("div");
  box.setAttribute("class", "box");
  box.setAttribute("style",`
    display:inline;
    max-width:300px;
    width:max-content;
    position:absolute;
    margin-top:-5px;
    z-index:0;`);

  const link = document.createElement("a");
  link.href = `https://translate.google.com/#view=home&op=translate&sl=en&tl=tr&text=${word}`;
  link.target = "_blank";
  link.style.outline = "0";

  const content = document.createElement("span");
  content.innerText = text;
  content.setAttribute("class", "onetap-content");
  content.setAttribute("style",`
    border-radius: 5px 0px 0px 5px;
    padding: 10px 20px;
    background-color: #333;
    font-size: 18px;
    font-family: Open Sans; 
    color: #fff;
    display: inline-block;`);

  link.appendChild(content);

  const removeButton = document.createElement("div");
  removeButton.onclick = _ =>
    removeHighlight(document.querySelectorAll(`span.${id}`));
  removeButton.className = "highlight-remove-button";
  removeButton.setAttribute("style",`
    position: absolute;
    height: 50%;
    width: 20px;
    top: 0;
    right: -20px;
    text-align: center;
    color: #fff;
    background-color: rgb(216, 76, 76);
    border-radius: 0px 5px 0px 0px;
    font-size: 14px;`);

  const infoButton = document.createElement("div");
  infoButton.onclick = _ => goDictionary(id, word);
  infoButton.className = "highlight-info-button";
  infoButton.setAttribute("style",`
    position: absolute;
    height: 50%;
    width: 20px;
    top: 50%;
    right: -20px;
    text-align: center;
    color: #fff;
    background-color: rgb(0, 108, 255);
    border-radius: 0px 0px 5px 0px;
    font-size: 14px;`);

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
		if(activeDict && activeDict in linkCreator){
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
