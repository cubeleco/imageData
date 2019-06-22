//Image Data by Cubeleco
//web extension that displays an info tooltip when hovering over an image

//converts a number in bytes to a human readable string
function getHumanReadable(fileSizeInBytes) {
	const byteUnits = [' B', ' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];
	var i = 0;
	for(; fileSizeInBytes > prefDiv; i++)
		fileSizeInBytes /= prefDiv;
	//round to first decimal place and add size unit
	return (Math.round(fileSizeInBytes * 10) / 10) + byteUnits[i];
}

function imgHover(event) {
	var img = event.target;
	var data = document.getElementById('imgData');
	var lastMX, lastMY;

	if(data) {
		//get previous mouse x&y for when image reloads
		lastMX = data.style.left;
		lastMY = data.style.top;

		//check if mouse left our div
		if(img.id !== 'imgData' && img.id !== 'imgDataSize') {
			//remove div from html
			data.parentNode.removeChild(data);
		}
	}
	if(img.nodeName.toLowerCase() !== 'img')
		return;
	//update data when the image finishes loading
	if(!img.complete) 	img.addEventListener('load', imgHover);


	//create div container
	data = document.createElement('div');
	data.id = 'imgData';
	//get position and style based off of preferences
	data.style.cssText = prefStyle;

	//reposition if tooltip/follow cursor
	if(prefPos === 2 || prefPos === 5) {
		data.style.left = lastMX;
		data.style.top = lastMY;
		img.addEventListener('mousemove', curMove);
	}
	else //remove leftover event listener if editing preferences
		img.removeEventListener('mousemove', curMove);
	//create info string to fill div. image dimensions and file extension 
	var ext = /jpe?g|a?png|gif|webp|tiff?|bmp|svg|bpg|ico/i.exec( img.src.substr(img.src.lastIndexOf('.')+1) );
	var fullDim = img.naturalWidth + '\u00D7' + img.naturalHeight + (ext? '\xa0' + ext[0] : '');

	//add first line to div
	data.appendChild(document.createTextNode(fullDim));
	data.appendChild(document.createElement('br'));

	//add alt text if pref enabled and if present
	if(prefAlt && img.alt) {
		data.appendChild(document.createTextNode(img.alt));
		data.appendChild(document.createElement('br'));
	}

	//display scaled dimensions if they differ from original
	if(prefScale && (img.width !== img.naturalWidth && img.height !== img.naturalHeight)) {
		data.appendChild(document.createTextNode(img.width + '\u2922' + img.height));
		data.appendChild(document.createElement('br'));
	}
	//add placeholder for filesize
	var size = document.createElement('div');
	size.id = 'imgDataSize';
	data.appendChild(size);
	
	//add div to page
	switch(prefPos) {
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
	
	//try to get filesize of image
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(this.readyState === 2 && this.status === 200) {
			var sizeDiv = document.getElementById('imgDataSize');
			var bytes = this.getResponseHeader('Content-Length');
			if(sizeDiv && bytes > 0)
				sizeDiv.textContent = getHumanReadable(bytes);
		}
	};
	xhr.open('HEAD', img.src, true);
	xhr.send();
}
function curMove(event) {
	var data = document.getElementById('imgData');

	if(data) {
		if(prefCurTop)
			data.style.top  = (event.clientY + prefCurOffY) + 'px';
		if(prefCurLeft)
			data.style.left = (event.clientX + prefCurOffX) + 'px';
	}
	if(prefPos == 5) //stop moving for tooltip
		event.target.removeEventListener('mousemove', curMove);
}

//preference global vars
var prefPos, prefDiv, prefStyle, prefAlt, prefScale;
var prefCurTop, prefCurLeft, prefCurOffX, prefCurOffY;


function setPrefs(storage) {
	//check extension enable status
	if(typeof storage.enabled === 'undefined' || storage.enabled) {
		prefPos = storage.position || 0;
		prefDiv = storage.fsdivision || 1024;
		var sty = storage.style || 'color: white; background: rgba(0,0,20,0.8); font: 1.2em Arial, Helvetica, sans-serif; padding: 4px; border-radius: 2px;';
		prefAlt = storage.alt || false;
		prefScale = storage.scale || false;

		//check for user positioning to overwrite follow cursor top/left 
		prefCurTop  = sty.indexOf(' top:') === -1;
		prefCurLeft = sty.indexOf(' left:') === -1;
		prefCurOffX = storage.offX || 20;
		prefCurOffY = storage.offY || 20;

		var pos;
		switch(prefPos) {
			case 1: //static
				pos = 'fixed;top:3px;left:3px;';
				break;
			case 2: //cursor
			case 5: //tooltip
				pos = 'fixed;';
				break;
			case 3: //above
			case 4: //below
				pos = 'static;';
				break;
			default://on top
				pos = 'absolute;';
		}
		//add default style attributes to hopefully avoid being affected by the page's styles
		prefStyle = 'z-index: 2147483647 !important; visibility: visible; overflow: auto; clear: both; line-height: normal; float: none; width: auto; position: ' + pos + sty;
		document.addEventListener('mouseover', imgHover);
	} else { //disable
		document.removeEventListener('mouseover', imgHover);
		//remove leftover div from page
		var data = document.getElementById('imgData');
		if(data)	data.parentNode.removeChild(data);
	}
}
function loadPreferences() {
	chrome.storage.local.get(['enabled', 'position', 'fsdivision', 'style', 'alt', 'scale', 'offX', 'offY'], setPrefs);
}

//reload preferences from browser local storage at startup and when changed
loadPreferences();
// document.addEventListener('DOMContentLoaded', loadPreferences);
chrome.storage.onChanged.addListener(loadPreferences);
