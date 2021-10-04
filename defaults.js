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
	br: 12,
	perfSize: 13
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
	getHeader: false,
	order: ['width','\u00d7','height','\u00a0','extension','br','perfSize'],
display: `[
"width", "\u00d7", "height", "\u00a0", "extension",
"br", "perfSize"
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

	//get elements from imgData div
	let sizeElem = data.querySelector('#imgData-size');
	let mimeElem = data.querySelector('#imgData-mime');
	let modifiedElem = data.querySelector('#imgData-modified');

	let bytes = Number(event.target.getResponseHeader('content-length'));
	const type = event.target.getResponseHeader('content-type');
	const modified = event.target.getResponseHeader('last-modified');
	if(sizeElem !== null && bytes > 0)
		sizeElem.textContent = getHumanReadable(bytes);
	if(mimeElem !== null)
		//remove image/ part of mime
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
		const orderStr = prefs.order[i];
		let elem;

		if(typeof orderStr !== 'string')
			continue;
		//if matches a data enum
		if(dataEnum[orderStr] >= 0) {
			if(orderStr === 'br')
				elem = document.createElement('br');
			else {
				//add data according to its id
				elem = document.createElement('span');
				elem.id = 'imgData-' + orderStr;
			}
		} else
			elem = document.createTextNode(orderStr);
		data.appendChild(elem);
	}
}
//fill spans with data
function getData(keepHeader) {
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
				const ext = /jpe?g|a?png|webp|gif|avif|tiff?|bmp|svg|bpg|ico|cur/i.exec( img.src.substring(img.src.lastIndexOf('.')+1) );
				txt = ext ? ext[0] : '';
				break;
			case dataEnum.name:
				txt = img.src.substring(img.src.lastIndexOf('/')+1, img.src.lastIndexOf('.'));
				break;
			case dataEnum.domain:
				txt = (new URL(img.src)).hostname;
				break;
			case dataEnum.alt:
				txt = img.alt;
				break;
			//clear old values; will be added when request is loaded
			case dataEnum.mime:
			case dataEnum.size:
			case dataEnum.modified:
				if(!keepHeader)
					txt = '';
				break;
			//ignore br elements
			case dataEnum.br:
				break;
			case dataEnum.perfSize:
				if(!window.performance)
					break;
				const perf = window.performance.getEntriesByName(img.src);

				//clear text if failed (blob:)
				txt = perf.length > 0 ? getHumanReadable(perf[0].decodedBodySize) : '';
				break;
			//dont count text nodes
			default:
				e--;
		}
		if(txt !== undefined) {
			data.children[e].textContent = txt;
		}
	}
}
