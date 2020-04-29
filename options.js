//display or hide element by id 
function displayElem(id, isVisible) {
	document.getElementById(id).style.display = isVisible ? 'inline' : 'none';
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
function saveStyle(event) {
	let style = document.createElement('div').style;
	//create style object from css text
	style.cssText = event.target.value;

	//save options to storage
	//if position properties defined, avoid cursor follow on that axis
	chrome.storage.local.set({
		style: event.target.value,
		curLeft: style.left === '' && style.right === '',
		curTop: style.top === '' && style.bottom === ''
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

//set text field value using shortcut key modifiers (modifier order doesn't matter)
function keyUpdate(event) {
	event.preventDefault();
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
function styleUpdate(event) { document.getElementById('previewDiv').style.cssText = event.target.value; }
function altUpdate(event) { displayElem('previewAlt', event.target.checked); }
function scaleUpdate(event) { displayElem('previewScale', event.target.checked); }
function posUpdate(event) {
	const num = Number(event.target.value);
	const disabled = (num !== 2 && num !== 5);
	document.getElementById('offX').disabled = disabled;
	document.getElementById('offY').disabled = disabled;
}
function sizeUpdate(event) {
	const enabled = Number(event.target.value) > 0;
	displayElem('previewSize', enabled);
	document.getElementById('fsprecision').disabled = !enabled;
}
function doNothing() {}


function setPrefs(storage) {
	//restore saved options
	document.getElementById('position').value = storage.position;
	document.getElementById('fsdivision').value = storage.fsdivision;
	document.getElementById('fsprecision').value = storage.fsprecision.toString().length - 1;
	document.getElementById('delay').value = storage.delay;
	document.getElementById('style').value = storage.style;
	document.getElementById('alt').checked = storage.alt;
	document.getElementById('scale').checked = storage.scale;
	document.getElementById('minWidth').value = storage.minWidth;
	document.getElementById('minHeight').value = storage.minHeight;
	document.getElementById('offX').value = storage.offX;
	document.getElementById('offY').value = storage.offY;

	//update page with saved options
	styleUpdate({target:{value: storage.style}});
	altUpdate({target:{checked: storage.alt}});
	scaleUpdate({target:{checked: storage.scale}});
	posUpdate({target:{value: storage.position}});
	sizeUpdate({target:{value: storage.fsdivision}});
	keyUpdate({target: document.getElementById('holdEnableKey'), preventDefault: doNothing, ...storage.holdEnableKey});
}
function restoreOptions() {
	loadPrefs(setPrefs);
}
function factoryReset() {
	if(window.confirm('Reset all shortcuts, options, and custom CSS to factory defaults?')) {
		//clear storage and reload page
		chrome.storage.local.clear();
		//not available in chrome
		chrome.commands.reset('_execute_browser_action');
		window.location.reload();
	}
}

//save options
document.getElementById('holdEnableKey').addEventListener('keydown', saveKey);
document.getElementById('position').addEventListener('input', saveNumber);
document.getElementById('fsdivision').addEventListener('input', saveNumber);
document.getElementById('fsprecision').addEventListener('input', savePrecision);
document.getElementById('delay').addEventListener('input', saveNumber);
document.getElementById('style').addEventListener('input', saveStyle);
document.getElementById('alt').addEventListener('change', saveChecked);
document.getElementById('scale').addEventListener('change', saveChecked);
document.getElementById('minWidth').addEventListener('input', saveNumber);
document.getElementById('minHeight').addEventListener('input', saveNumber);
document.getElementById('offX').addEventListener('input', saveNumber);
document.getElementById('offY').addEventListener('input', saveNumber);
//options updating the page
document.getElementById('holdEnableKey').addEventListener('keydown', keyUpdate);
document.getElementById('position').addEventListener('input', posUpdate);
document.getElementById('fsdivision').addEventListener('input', sizeUpdate);
document.getElementById('style').addEventListener('input', styleUpdate);
document.getElementById('alt').addEventListener('change', altUpdate);
document.getElementById('scale').addEventListener('change', scaleUpdate);

document.getElementById('factoryReset').addEventListener('click', factoryReset);
//init
document.addEventListener('DOMContentLoaded', restoreOptions);
