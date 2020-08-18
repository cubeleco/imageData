//data: dom element to display image data
//img: last hovered image to avoid loading same data
var data, img, haveHeader;

//enums of image data to display
const dataEnum = {
	width: 0,
	height: 1,
	scaledWidth: 2,
	scaledHeight: 3,
	size: 4,
	pixels: 5,
	name: 6,
	extension: 7,
	domain: 8,
	alt: 9,
	mime: 10,
	modified: 11,
	br: 12
};
//extension option storage
var prefs = {
	enabled: true,
	holdEnableKey: {key: 'disabled'},
	position: 0,
	fsdivision: 1024,
	fsprecision: 10,
	fsseparator: ' ',
	delay: 0,
	style: 'color: white; background-color: rgba(0,0,10, 0.8); font: 1rem Arial, Helvetica, sans-serif; padding: 2px 5px; border-radius: 5px;',
	offX: 20,
	offY: 20,
	curLeft: true,
	curTop: true,
	minWidth: 0,
	minHeight: 0,
	getHeader: true,
	order: ['width','\u00d7','height','\u00a0','mime','br','size'],
display: `[
"width", "\u00d7", "height", "\u00a0", "mime",
"br", "size"
]`
};
function loadPrefs(callback) {
	chrome.storage.local.get(prefs, callback);
}
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
	const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let i = 0;
	for(; bytes > prefs.fsdivision; i++)
		bytes /= prefs.fsdivision;
	//round to fsprecision #decimal places and add size unit
	return roundToPrecision(bytes).toLocaleString() + prefs.fsseparator + units[i];
}
function readImgHeader(event) {
	if(event.target.status !== 200)
		return;
	haveHeader = true;

	let sizeElem = document.getElementById('imgData-size');
	let mimeElem = document.getElementById('imgData-mime');
	let modifiedElem = document.getElementById('imgData-modified');

	let bytes = Number(event.target.getResponseHeader('content-length'));
	const type = event.target.getResponseHeader('content-type');
	const modified = event.target.getResponseHeader('last-modified');
	if(sizeElem !== null && bytes > 0)
		sizeElem.textContent = getHumanReadable(bytes);
	if(mimeElem !== null)
		mimeElem.textContent = type.substring(type.lastIndexOf('/')+1);
	if(modifiedElem !== null)
		modifiedElem.textContent = modified;
}
function getHeader(keepOld) {
	//don't get size when disabled
	//keep if filesize already exists
	if(!prefs.enabled || !prefs.getHeader || img === undefined || img.src === '' || (keepOld && haveHeader))
		return;

	let xhr = new XMLHttpRequest();
	xhr.addEventListener('load', readImgHeader);
	xhr.open('HEAD', img.src, true);
	xhr.send();
}
//prepare data div according to prefs.order
function appendData() {
	for(let i=0; i < prefs.order.length; i++) {
		if(typeof prefs.order[i] !== 'string')
			continue;
		//if enum
		if(typeof dataEnum[prefs.order[i]] === 'number') {
			if(prefs.order[i] === 'br')
				data.appendChild(document.createElement('br'));
			else {
				//add data according to its id
				let span = document.createElement('span');
				span.id = 'imgData-' + prefs.order[i];
				data.appendChild(span);
			}
		} else
			data.appendChild(document.createTextNode(prefs.order[i]));
	}
}
//fill spans with data
function getData() {
	const srcUrl = new URL(img.src);
	//mark to get new header
	haveHeader = false;

	for(let i=0, e=0; i < prefs.order.length; i++, e++) {
		let txt;
		//add data according to its id
		switch(dataEnum[prefs.order[i]]) {
			case dataEnum.width:
				txt = img.naturalWidth;
				break;
			case dataEnum.height:
				txt = img.naturalHeight;
				break;
			case dataEnum.scaledWidth:
				txt = img.width;
				break;
			case dataEnum.scaledHeight:
				txt = img.height;
				break;
			case dataEnum.pixels:
				txt = img.naturalWidth * img.naturalHeight;
				break;
			case dataEnum.extension:
				txt = (/jpe?g|a?png|gif|webp|tiff?|bmp|svg|bpg|ico|cur/i.exec( srcUrl.pathname.substring(srcUrl.pathname.lastIndexOf('.')+1) ))[0];
				break;
			case dataEnum.name:
				txt = srcUrl.pathname.substring(srcUrl.pathname.lastIndexOf('/')+1, srcUrl.pathname.lastIndexOf('.'));
				break;
			case dataEnum.domain:
				txt = srcUrl.hostname;
				break;
			case dataEnum.alt:
				txt = img.alt;
				break;
			//clear old values; will be added when request is loaded
			case dataEnum.mime:
			case dataEnum.size:
			case dataEnum.modified:
				txt = '';
				break;
			//ignore br elements
			case dataEnum.br:
				break;
			default: //count only elements
				e--;
		}
		if(txt !== undefined) {
			data.children[e].textContent = txt;
		}
	}
}
