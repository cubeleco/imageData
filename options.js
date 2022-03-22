//display or hide element by id 
function displayElem(id, isVisible) {
	document.getElementById(id).style.display = isVisible ? 'inline' : 'none';
}
function autoGrow(event) {
	event.target.style.height = 'auto';
	event.target.style.height = (event.target.scrollHeight + 5) + 'px';
}
//save input val using its id as a name
function saveValue(event) {
	chrome.storage.local.set({ [event.target.id]: event.target.value });
}
function saveNumber(event) {
	chrome.storage.local.set({ [event.target.id]: Number(event.target.value) });
}
//calculate precision scaling ahead of time
function savePrecision(event) {
	chrome.storage.local.set({ [event.target.id]: Math.pow(10, event.target.value) });
}
function saveChecked(event) {
	chrome.storage.local.set({ [event.target.id]: event.target.checked });
}
//get data order and parameter pairs
function saveOrder(event) {
	saveValue(event);
	let header = false;
	let order;
	try {
		order = JSON.parse(event.target.value);
	} catch(e) {
		event.target.classList.add('error');
		return;
	}
	event.target.classList.remove('error');
	//find if any header values should be requested
	for(let i=order.length - 1; i >= 0; i--) {
		switch(dataEnum[order[i]]) {
			case dataEnum.size:
			case dataEnum.mime:
			case dataEnum.modified:
				header = true;
				break;
		}
	}
	chrome.storage.local.set({ getHeader: header, order: order });
}
function saveStyle(event) {
	//save options to storage
	//if position properties defined, avoid cursor follow on that axis
	chrome.storage.local.set({
		style: event.target.value,
		curLeft: data.style.left === '' && data.style.right === '',
		curTop: data.style.top === '' && data.style.bottom === ''
	});
}
function saveKey(event) {
	chrome.storage.local.set({ [event.target.id]:
		//remove shortcut on modifier key
		(event.key === 'Escape') ? {key: 'disabled'} : {
			key: event.key,
			ctrlKey: event.ctrlKey,
			shiftKey: event.shiftKey,
			altKey: event.altKey
		}
	});
}

function orderUpdate() {
	//clear old data
	data.textContent = '';
	if(!prefs.enabled)
		return;
	appendData();
	getData(false);
	getHeader(false);
}
//set text field value using shortcut key modifiers (modifier order doesn't matter)
function keyUpdate(event) {
	const modKeys = ['control', 'shift', 'alt', 'os', 'meta'];
	const lowkey = event.key.toLowerCase();
	//clear text field
	event.target.value = '';

	//clear and lose focus on escape
	if(lowkey === 'disabled' || lowkey === 'escape') {
		event.target.blur();
		return;
	}
	if(event.ctrlKey)
		event.target.value += 'Ctrl+';
	if(event.shiftKey)
		event.target.value += 'Shift+';
	if(event.altKey)
		event.target.value += 'Alt+';
	//avoid adding modifier keys
	if(modKeys.indexOf(lowkey) < 0)
		event.target.value += lowkey;
}
function styleUpdate(event) { data.style.cssText = event.target.value; }
function posUpdate(event) {
	const num = Number(event.target.value);
	const disabled = (num !== 2 && num !== 5);
	document.getElementById('offX').disabled = disabled;
	document.getElementById('offY').disabled = disabled;
}

function setPrefs(storage) {
	prefs = storage;
	//set up for data preview
	data = document.getElementById('previewDiv');
	img = document.createElement('img');
	img.src = chrome.runtime.getURL('icons/thumb-48.png');
	img.alt = 'Preview alt text';
	img.addEventListener('load', orderUpdate);

	//restore saved options
	document.getElementById('position').value = storage.position;
	document.getElementById('fsdivision').value = storage.fsdivision;
	document.getElementById('fsprecision').value = storage.fsprecision.toString().length - 1;
	document.getElementById('delay').value = storage.delay;
	document.getElementById('display').value = storage.display;
	document.getElementById('style').value = storage.style;
	document.getElementById('minWidth').value = storage.minWidth;
	document.getElementById('minHeight').value = storage.minHeight;
	document.getElementById('offX').value = storage.offX;
	document.getElementById('offY').value = storage.offY;
	document.getElementById('newtabOnly').checked = storage.newtabOnly;

	window.setTimeout(autoGrow, 1000, {target: document.getElementById('display')});
	window.setTimeout(autoGrow, 1000, {target: document.getElementById('style')});
	//update page with saved options
	styleUpdate({target:{value: storage.style}});
	posUpdate({target:{value: storage.position}});
	keyUpdate({target: document.getElementById('holdEnableKey'), ...storage.holdEnableKey});
}
function restoreOptions() {
	loadPrefs(setPrefs);
}
function orderChange(changes) {
	for(let key in changes) {
		if(changes[key].newValue !== undefined)
			prefs[key] = changes[key].newValue;
	}
	if(changes.enabled || changes.order)
		orderUpdate();
}
function cancelReset(target) {
	target.textContent = 'Default options';
}
function factoryReset(event) {
	if(event.target.textContent === 'Confirm') {
		//clear storage and reload page
		chrome.storage.local.clear();
		//not available in chrome
		//chrome.commands.reset('_execute_browser_action');
		window.location.reload();
	}
	event.target.textContent = 'Confirm';
	window.setTimeout(cancelReset, 2000, event.target);
}

//save options
document.getElementById('holdEnableKey').addEventListener('keydown', saveKey);
document.getElementById('position').addEventListener('input', saveNumber);
document.getElementById('fsdivision').addEventListener('input', saveNumber);
document.getElementById('fsprecision').addEventListener('input', savePrecision);
document.getElementById('delay').addEventListener('input', saveNumber);
//style needs to be calculated before saved
document.getElementById('style').addEventListener('input', styleUpdate);
document.getElementById('style').addEventListener('input', saveStyle);
document.getElementById('display').addEventListener('input', saveOrder);
document.getElementById('minWidth').addEventListener('input', saveNumber);
document.getElementById('minHeight').addEventListener('input', saveNumber);
document.getElementById('offX').addEventListener('input', saveNumber);
document.getElementById('offY').addEventListener('input', saveNumber);
document.getElementById('newtabOnly').addEventListener('input', saveChecked);
//options updating the page
document.getElementById('holdEnableKey').addEventListener('keydown', keyUpdate);
document.getElementById('position').addEventListener('input', posUpdate);
document.getElementById('display').addEventListener('input', autoGrow);
document.getElementById('style').addEventListener('input', autoGrow);

chrome.storage.onChanged.addListener(orderChange);
document.getElementById('factoryReset').addEventListener('click', factoryReset);
//init
document.addEventListener('DOMContentLoaded', restoreOptions);
