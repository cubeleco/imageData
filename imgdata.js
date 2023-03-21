//Image Data by Cubeleco
//web extension that displays an info tooltip when hovering over an image

	//global variables
//holdEnableDown: if holdEnableKey is held down
//lastHeight: last hovered image height for image finishing onload
//delayTimeout: timeout index for delayed display of data
var holdEnableDown, lastHeight, delayTimeout;

//add div to page
function placeDiv() {
	switch(prefs.position) {
		case 1: //fixed
		case 2: //cursor
		case 5: //tooltip
			document.body.appendChild(data);
			break;
		case 4: //after
			img.parentNode.appendChild(data);
			break;
		default: //over and before
			img.parentNode.insertBefore(data, img);
	}
}
function displayData(isVisible) {
	data.style.visibility = isVisible ? 'visible' : 'hidden';
	data.style.opacity = isVisible ? 1:0;
}

	//main display of data function
function imgHover(event) {
	//hide data if not an image
	if(event.target.tagName.toLowerCase() !== 'img') {
		//avoid hiding on hovering data ie small images
		if(!event.target.id.startsWith('imgData'))
			displayData(false);
		return;
	}

	//hide if img is smaller than minimum
	if(event.target.width < prefs.minWidth || event.target.height < prefs.minHeight) {
		displayData(false);
		return;
	}
	//dont change display incase mouse left img before onload
	if(event.type !== 'load') {
		//show data after delay if set
		if(prefs.enabled && prefs.delay > 0) {
			window.clearTimeout(delayTimeout);
			delayTimeout = window.setTimeout(displayData, prefs.delay, true);
		}
		else
			displayData(prefs.enabled);

		//reuse MouseEvent to reposition if tooltip
		if(prefs.position === 2 || prefs.position === 5)
			curMove(event);
	}

	if(img !== undefined) {
		//avoid getting same data
		if(event.target.src === img.src && event.target.naturalHeight === lastHeight) {
			//perfSize needs to update sightly delayed after load; keep header after first load
			window.setTimeout(getData, 1, true);
			//image may be reused or finished loading
			placeDiv();
			//enabled may have changed on different page
			getHeader(true);
			return;
		}
		//remove old listener
		img.removeEventListener('load', imgHover);
	}
	img = event.target;
	lastHeight = img.naturalHeight;
	img.addEventListener('load', imgHover);

	//dont add or place data before prefs have loaded
	if(prefs.enabled === undefined)
		return;

	//mark to get new header
	haveHeader = false;
	//put data on page and force header request
	getData(false);
	placeDiv();
	getHeader(false);
}
function curMove(event) {
	if(prefs.curTop)
		data.style.top = (event.clientY + prefs.offY) + 'px';
	if(prefs.curLeft)
		data.style.left = (event.clientX + prefs.offX) + 'px';
}

	//keyboard functions
function toggleState() {
	prefs.enabled = !prefs.enabled;
	chrome.storage.local.set({ enabled: prefs.enabled });
}
function keyMatch(obj, event) {
	for(let key in obj) {
		if(obj[key] !== event[key])
			return false;
	}
	return true;
}
function keyDown(event) {
	if(event.repeat)
		return;
	//toggle state on matching key
	if(keyMatch(prefs.holdEnableKey, event)) {
		holdEnableDown = true;
		toggleState();
	}
}
function keyUp(event) {
	//if key was held and released regardless of shift key
	if(holdEnableDown && event.key.toLowerCase() === prefs.holdEnableKey.key.toLowerCase()) {
		holdEnableDown = false;
		toggleState();
	}
}

	//preferences functions
function setPrefs(storage) {
	const isNewTab = document.body.childElementCount === 1 && document.body.firstElementChild.tagName.toLowerCase() === 'img';
	//check for page not in a new tab
	if(storage.newtabOnly && !isNewTab) {
		//remove div and eventlisteners
		if(img !== undefined)
			img.removeEventListener('load', imgHover);

		document.removeEventListener('mouseover', imgHover);
		document.removeEventListener('touchstart', imgHover);
		chrome.storage.onChanged.removeListener(enabledChange);
		//free up memory
		data = undefined;
		img = undefined;
		haveHeader = undefined;
		prefs = undefined;
		loadPrefs = undefined;
		roundToPrecision = undefined;
		getHumanReadable = undefined;
		readImgHeader = undefined;
		getHeader = undefined;
		appendData = undefined;
		getData = undefined;

		holdEnableDown = undefined;
		lastHeight = undefined;
		delayTimeout = undefined;
		placeDiv = undefined;
		displayData = undefined;
		imgHover = undefined;
		curMove = undefined;
		toggleState = undefined;
		keyMatch = undefined;
		keyDown = undefined;
		keyUp = undefined;
		init = undefined;
		enabledChange = undefined;
		setPrefs = undefined;
		return;
	}
	prefs = storage;

	//default:0 over
	let pos = 'absolute;';
	switch(prefs.position) {
		case 1: //fixed
			pos = 'fixed;top:3px;left:3px;';
			break;
		case 2: //cursor
			document.addEventListener('mousemove', curMove);
		case 5: //tooltip
			pos = 'fixed;';
			break;
		case 3: //before
		case 4: //after
			pos = 'static;';
			break;
	}
	//add default style attributes to hopefully avoid being affected by the page's styles
	data.style.cssText = 'z-index: 2147483647 !important; overflow: auto; clear: both; line-height: normal; float: none; width: auto; height: auto; position: ' + pos + prefs.style;
	displayData(false);
	appendData();

	//force display on newtab
	if(isNewTab) {
		img = document.body.firstElementChild;
	}
	//reload data if img hovered before prefs were loaded
	if(img !== undefined) {
		//TODO no easy way to get clientX cursor coords
		const ev = {target: img};
		//clear old img to prevent duplicate
		img = undefined;
		imgHover(ev);
	}
	//listen for shortcut keys if defined
	if(prefs.holdEnableKey.key !== 'disabled') {
		document.addEventListener('keydown', keyDown);
		document.addEventListener('keyup', keyUp);
	}
}
function enabledChange(changes) {
	//only update on enabled change
	if(changes.enabled === undefined || changes.enabled.newValue === undefined)
		return;
	prefs.enabled = changes.enabled.newValue;
	//avoid change from different tab
	if(document.hasFocus()) {
		displayData(prefs.enabled);
		//get filesize if it has not been set yet
		getHeader(true);
	}
}

function init() {
	//set global vars
	holdEnableDown = false;
	data = document.createElement('div');
	data.id = 'imgData';

	//start image hover before page or prefs are loaded
	document.addEventListener('mouseover', imgHover);
	document.addEventListener('touchstart', imgHover);

	//reload preferences from addon local storage
	loadPrefs(setPrefs);
	//set prefs as unloaded for imgHover
	prefs.enabled = undefined;
}
init();
chrome.storage.onChanged.addListener(enabledChange);
