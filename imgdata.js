//Image Data by Cubeleco
//web extension that displays an info tooltip when hovering over an image

	//global variables
//holdEnableDown: if holdEnableKey is held down
//data: dom element to display image data
//img: last hovered image to avoid loading same data
//lastHeight: last hovered image height for image finishing onload
var holdEnableDown, data, img, lastHeight, delayTimeout;

	//helper functions
//round num to #digits after the decimal point
//avoids trailing 0s of Number.toFixed()
function roundToPrecision(num) {
	//avoid divide by 0
	if(prefs.fsprecision <= 0)
		return Math.round(num);
	return Math.round(num * prefs.fsprecision) / prefs.fsprecision;
}
//converts a number in bytes to a human readable string
function getHumanReadable(bytes) {
	const units = [' B', ' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];
	let i = 0;
	for(; bytes > prefs.fsdivision; i++)
		bytes /= prefs.fsdivision;
	//round to fsprecision #decimal places and add size unit
	return roundToPrecision(bytes) + units[i];
}
function readImgHeader(event) {
	if(event.target.status !== 200)
		return;

	let sizeDiv = data.lastElementChild;
	let bytes = Number(event.target.getResponseHeader('Content-Length'));
	if(sizeDiv.id === 'imgDataSize' && bytes > 0)
		sizeDiv.textContent = getHumanReadable(bytes);
}
function getFileSize(keepOld) {
	//don't get size when disabled
	if(!prefs.enabled || prefs.fsdivision < 0 || img === undefined || img.src === '')
		return;
	//keep if filesize already exists
	if(keepOld && data.lastElementChild.textContent !== '')
		return;

	let xhr = new XMLHttpRequest();
	xhr.addEventListener('load', readImgHeader);
	xhr.open('HEAD', img.src, true);
	xhr.send();
}
function appendTextLine(node, text) {
	node.appendChild(document.createTextNode(text));
	node.appendChild(document.createElement('br'));
}
//add div to page
function placeData() {
	switch(prefs.position) {
		case 1: //static
		case 2: //cursor
		case 5: //tooltip
			document.body.appendChild(data);
			break;
		case 4: //below
			img.parentNode.appendChild(data);
			break;
		default: //on top and above
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
		if(event.target.id !== 'imgData' && event.target.id !== 'imgDataSize')
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
		displayData(false);
		window.clearTimeout(delayTimeout);
		//show data after delay if set
		if(prefs.enabled && prefs.delay > 0)
			delayTimeout = window.setTimeout(displayData, prefs.delay, true);
		else
			displayData(prefs.enabled);

		//reuse MouseEvent to reposition if tooltip
		if(prefs.position === 2 || prefs.position === 5)
			curMove(event);
	}

	if(img !== undefined) {
		//avoid getting same data
		if(event.target.src === img.src && event.target.naturalHeight === lastHeight) {
			//image may be reused or finished loading
			placeData();
			//enabled may have changed on different page
			getFileSize(true);
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
	//clear and set data div container
	data.textContent = '';

	//get file extension and image resolution
	let ext = /jpe?g|a?png|gif|webp|tiff?|bmp|svg|bpg|ico|cur/i.exec( img.src.substr(img.src.lastIndexOf('.')+1) );
	let fullRes = img.naturalWidth + '\u00D7' + img.naturalHeight + (ext? '\xa0' + ext[0] : '');
	//add first line to div
	appendTextLine(data, fullRes);

	//add alt text if pref enabled and if present
	if(prefs.alt && img.alt) {
		appendTextLine(data, img.alt);
	}

	//display scaled dimensions if they differ from original
	if(prefs.scale && (img.width !== img.naturalWidth && img.height !== img.naturalHeight)) {
		appendTextLine(data, img.width + '\u2922' + img.height);
	}
	//add placeholder for filesize
	let size = document.createElement('div');
	size.id = 'imgDataSize';
	data.appendChild(size);
	
	//put data on page and force request filesize header
	placeData();
	getFileSize(false);
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
	prefs = storage;

	//default:0 on top
	let pos = 'absolute;';
	switch(prefs.position) {
		case 1: //static
			pos = 'fixed;top:3px;left:3px;';
			break;
		case 2: //cursor
			document.addEventListener('mousemove', curMove);
		case 5: //tooltip
			pos = 'fixed;';
			break;
		case 3: //above
		case 4: //below
			pos = 'static;';
			break;
	}
	//add default style attributes to hopefully avoid being affected by the page's styles
	data.style.cssText = 'z-index: 2147483647 !important; overflow: auto; clear: both; line-height: normal; float: none; width: auto; height: auto; position: ' + pos + prefs.style;
	//displayData(prefs.enabled);

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
	if(changes.enabled.newValue !== undefined) {
		prefs.enabled = changes.enabled.newValue;
		//avoid change from different tab
		if(document.hasFocus()) {
			displayData(prefs.enabled);
			//get filesize if it has not been set yet
			getFileSize(true);
		}
	}
}
function init() {
	//set global vars
	holdEnableDown = false;
	data = document.createElement('div');
	data.id = 'imgData';

	//start image hover before page or prefs are loaded
	document.addEventListener('mouseover', imgHover);
	//reload preferences from addon local storage
	loadPrefs(setPrefs);
}
init();
chrome.storage.onChanged.addListener(enabledChange);
