const dicts = [{
	id: "cambridge",
	title: "Cambridge Dictionary",
}, {
	id: "tureng",
	title: "Tureng"
}];

function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
};

browser.contextMenus.onClicked.addListener((info, tab) => {
	if(info.type === "radio"){
		browser.storage.sync.set({
			activeDictId: info.menuItemId
		})
	}else if(info.menuItemId === "permanentBoxes"){
		browser.storage.sync.set({
			permanentBoxesValue: info.checked
		})
	}
})

browser.storage.sync.get(['activeDictId', 'permanentBoxesValue']).then(values => {
	let { activeDictId, permanentBoxesValue } = values;
	if(!dicts.map(dict => dict.id).includes(activeDictId)){
		activeDictId = dicts[0].id;
		browser.storage.sync.set({ activeDictId: dicts[0].id }) 
	}
	if(permanentBoxesValue === null){
		permanentBoxes = true;
		browser.storage.sync.set({ permanentBoxesValue: true }) 
	}

	for(var dict of dicts){
		browser.contextMenus.create({
		  id: dict.id,
		  type: "radio",
		  title: dict.title,
		  contexts: ["all"],
		  checked: dict.id === activeDictId
		}, onCreated);
	}
	browser.contextMenus.create({
		id: "separator-1",
		type: "separator",
		contexts: ["all"]
	}, onCreated);

	browser.contextMenus.create({
		id: "permanentBoxes",
		type: "checkbox",
		title: "Çeviriler sayfa üzerinde kalsın",
		contexts: ["all"],
		checked: permanentBoxesValue
	}, onCreated);
})
