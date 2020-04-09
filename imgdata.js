//Image Data by Cubeleco
//web extension that displays an info tooltip when hovering over an image

//holdEnableDown: if holdEnableKey is held down
//data: dom element to display image data
//img: last loaded image to avoid loading same data
var holdEnableDown, data, img;

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
	if(event.target.status === 200) {
		let sizeDiv = data.lastElementChild;
		let bytes = Number(event.target.getResponseHeader('Content-Length'));
		if(sizeDiv.id === 'imgDataSize')
			sizeDiv.textContent = getHumanReadable(bytes);
	}
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
	if(isVisible) //show data
		data.style.removeProperty('display');
	else //hide data
		data.style.display = 'none';
}

function imgHover(event) {
	//hide data if not an image
	if(event.target.tagName.toLowerCase() !== 'img') {
		//avoid hiding on hovering data ie small images
		if(event.target.id !== 'imgData' && event.target.id !== 'imgDataSize')
			displayData(false);
		return;
	}
	displayData(prefs.enabled);

	//avoid getting same data
	if(img !== undefined && event.target.src === img.src) {
		//image may be reused or finished loading
		placeData();
		return;
	}
	img = event.target;

	//update data when the image finishes loading
	if(!img.complete)
		img.addEventListener('load', imgHover);
	else
		img.removeEventListener('load', imgHover);

	//clear and show div container
	data.textContent = '';
	//get position and style based off of preferences

	//reuse MouseEvent to reposition if tooltip
	if(prefs.position === 2 || prefs.position === 5)
		curMove(event);
	//create info string to fill div. image dimensions and file extension 
	let ext = /jpe?g|a?png|gif|webp|tiff?|bmp|svg|bpg|ico/i.exec( img.src.substr(img.src.lastIndexOf('.')+1) );
	let fullDim = img.naturalWidth + '\u00D7' + img.naturalHeight + (ext? '\xa0' + ext[0] : '');

	//add first line to div
	appendTextLine(data, fullDim);

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
	
	placeData();

	//avoid sending cross site requests
	if(prefs.fsdivision > 0 && new URL(img.src).hostname === document.domain) {
		//try to get filesize of image
		let xhr = new XMLHttpRequest();
		xhr.addEventListener('load', readImgHeader);
		xhr.open('HEAD', img.src, true);
		xhr.send();
	}
}
function curMove(event) {
	if(prefs.curTop)
		data.style.top  = (event.clientY + prefs.offY) + 'px';
	if(prefs.curLeft)
		data.style.left = (event.clientX + prefs.offX) + 'px';
}

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
	if(keyMatch(prefs.enableKey, event))
		toggleState();
}
function keyUp(event) {
	//if key was held and released regardless of shift key
	if(holdEnableDown && event.key.toLowerCase() === prefs.holdEnableKey.key.toLowerCase()) {
		holdEnableDown = false;
		toggleState();
	}
}
function setPrefs(storage) {
	prefs = storage;
	//calculate scaling ahead see roundToPrecision()
	prefs.fsprecision = Math.pow(10, prefs.fsprecision);
	//don't track cursor movement of axis set in user css
	prefs.curTop = prefs.style.indexOf(' top:') === -1;
	prefs.curLeft = prefs.style.indexOf(' left:') === -1;

	let pos;
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
		default://0: on top
			pos = 'absolute;';
	}
	//add default style attributes to hopefully avoid being affected by the page's styles
	data.style.cssText = 'z-index: 2147483647 !important; visibility: visible; overflow: auto; clear: both; line-height: normal; float: none; width: auto; position: ' + pos + prefs.style;
	displayData(prefs.enabled);

	//reload data if img hovered before prefs were loaded
	if(img !== undefined) {
		//clear old img to prevent duplicate
		const ev = {target: img};
		img = undefined;
		imgHover(ev);
	}
	document.addEventListener('keydown', keyDown);
	document.addEventListener('keyup', keyUp);
}
function enabledChange(changes) {
	if(changes.enabled.newValue !== undefined) {
		prefs.enabled = changes.enabled.newValue;
		displayData(prefs.enabled);
	}
}
function init() {
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
