const get = (sl, tl, q) => {
	q = q.replace(".", "").replace("?", "").replace(",", ",")
	return fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURI(q)}`)
  	.then(res => res.ok ? res.json() : res.text());
}

const createPopup = (id, text, x, y, clientWidth) => {

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

	const content = document.createElement("span")
	content.setAttribute("class", "content");
	content.innerText = text;
	content.style.display = "inline";
	content.style.maxWidth = "300px";
	content.style.width = "max-content";
	content.style.position = "absolute";
	content.style.borderRadius = "10px";
	content.style.padding = "10px 20px";
	content.style.backgroundColor = "#333";
	content.style.fontSize = "18px";
	content.style.font = "Open Sans";
	content.style.color = "#fff";
	content.style.marginTop = "-5px";

	popup.appendChild(content);
	document.body.appendChild(popup);

	content.style.left = (offsetX - (Number(r === -1) * content.clientWidth)) + "px";

	var draw = SVG().addTo(`#${id}`).size(offsetX, 16)
	draw.node.style.overflow = "visible";
	var line = draw.polyline([0, 0, 10 * r, 10, offsetX, 10]);
	line.stroke({ color: '#ccc', width: 3 }).fill("none");
}

const injectHighlight = (selection, id) => {
	let parentElement = selection.anchorNode.parentElement;
	const highlight = Array.from(selection.anchorNode.textContent).map((_, key) => {
		if(key === selection.anchorOffset){
			return `<span class="${id} onetap-highlight" style="background-color: #b65656; color: #fff">${_}`
		}
		if(key === selection.focusOffset){
			return `${_.trim("")}</span> `
		}
		return _;
	}).filter(Boolean).join("");

	parentElement.innerHTML = parentElement.innerHTML.replace(selection.anchorNode.textContent, highlight)

	let {top, left, width, height} = document.querySelector(`span.${id}`).getBoundingClientRect();
	if((left + window.pageXOffset + width) < document.body.clientWidth/2){
		width = 0;
	}

	const spans = Array.from(document.querySelectorAll("span.onetap-highlight"))
	.filter(el => el.getBoundingClientRect().top === top)
	.filter(el => el.classList[0] !== id)
	.map(el => {
		el.outerHTML = el.innerText;
		let div = document.querySelector(`div#${el.classList[0]}`);
		if(div){ div.remove() }
	})


	return { x: left + window.pageXOffset + width, y: top + window.pageYOffset + height - 5,  }
}

document.addEventListener("click", mouse => {
	if(!mouse.ctrlKey) {
		return
   	}

	const selection = window.getSelection();
	console.log(selection)
	const word = selection.toString();
	if(!word){ return };

	const id = Math.random().toString(36).substring(7);

	const {x, y} = injectHighlight(selection, id)

	get("en", "tr", word).then((res) => {
		createPopup(id, res[0][0][0], x, y, document.body.clientWidth)
	}).catch(console.log)
});
