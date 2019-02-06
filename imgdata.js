//Image Data by Cubeleco
//web extension that displays an info tooltip when hovering over an image

function getHumanReadable(fileSizeInBytes) {
	var i = -1;
	var byteUnits = [' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];
	do {
		fileSizeInBytes /= 1024;
		i++;
	} while (fileSizeInBytes > 1024);

	return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
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
		if(img.id != 'imgData' && img.id != 'imgDataSize') {
			//remove div from html
			data.parentNode.removeChild(data);
		}
	}
	if(img.nodeName.toLowerCase() == 'img') {
	//get image data according to prefs and add to page
		//update data when the image finishes loading
		if(!img.complete) 	img.addEventListener('load', imgHover);

		//reposition if tooltip
		if(prefPos == 2 || prefPos == 5)
			img.addEventListener('mousemove', curMove);
		else //remove leftover event listener if editing preferences
			img.removeEventListener('mousemove', curMove);

		//get position and style based off of preferences
		var pos;
		switch(prefPos) {
			default://on top
				pos = 'absolute';
				break;
			case 1: //static
				pos = 'fixed;top:3px;left:3px';
				break;
			case 2: //cursor
			case 5: //tooltip
				//add our previous mouse position for when image reloads
				pos = 'fixed;top:' +lastMY+ ';left:' +lastMX;
				break;
			case 3: //above
			case 4: //below
				pos = 'static';
				break;
		}

		//create div container
		data = document.createElement('div');
		data.id = 'imgData';
		data.style.cssText = 'z-index: 9999999999 !important; visibility: visible; overflow: auto; clear: both; line-height: normal; float: none; width: auto; position: ' + pos + ';' + prefStyle;

		//add placeholder for filesize
		var size = document.createElement('div');
		size.id = 'imgDataSize';

		//create info string to fill div. image dimensions and file extension 
		var ext = (/(jpe?g|a?png|gif|webp|tiff?|bmp|svg|bpg|ico)/i).exec( img.src.substr(img.src.lastIndexOf('.')+1) );
		var text = img.naturalWidth + '\u00D7' + img.naturalHeight + (ext? '\xa0' + ext[0] : '');

		//add first line to div
		data.appendChild(document.createTextNode(text));
		data.appendChild(document.createElement('br'));

		//display scaled dimensions if they differ from original
		if(prefScale && (img.width != img.naturalWidth && img.height != img.naturalHeight)) {
			data.appendChild(document.createTextNode(img.width + '\u2922' + img.height));
			data.appendChild(document.createElement('br'));
		}
		data.appendChild(size);
		
		//add div to page
		switch(prefPos) {
			default: //on top and above
				img.parentNode.insertBefore(data, img);
				break;
			case 1: //static
			case 2: //cursor
			case 5: //tooltip
				document.body.appendChild(data);
				break;
			case 4: //below
				img.parentNode.appendChild(data);
				break;
		}
		
		//try to get filesize of image
		var xhr = new XMLHttpRequest();
		xhr.open('HEAD', img.src, true);
		xhr.send();
		xhr.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200) {
				var sizeDiv = document.getElementById('imgDataSize');
				if(sizeDiv)
					sizeDiv.innerText = getHumanReadable(this.getResponseHeader('Content-Length'));
			}
		};
	}
}
function curMove(event) {
	var data = document.getElementById('imgData');

	if(data) {
		if(prefCurTop)
			data.style.top  = (event.clientY + prefCurOffY) + 'px';
		if(prefCurLeft)
			data.style.left = (event.clientX + prefCurOffX) + 'px';
		if(prefPos == 5) //stop moving for tooltip
			event.target.removeEventListener('mousemove', curMove);
	}
}

//preference global vars
var prefPos, prefStyle, prefScale;
var prefCurTop, prefCurLeft, prefCurOffX, prefCurOffY;

function loadPreferences() {
	function setPrefs(storage) {
		//check enable status
		if(typeof storage.enabled == 'undefined' || storage.enabled) {
			document.addEventListener('mouseover', imgHover);
		
			prefPos = storage.position || 0;
			prefStyle = storage.style || 'color: rgba(255,255,255,1.0); background: rgba(0,0,20,0.8); font: 1.2em Arial, Helvetica, sans-serif; padding: 4px; border-radius: 2px;';
			prefScale = storage.scale || false;

			//check for user positioning to overwrite follow cursor top/left 
			prefCurTop  = prefStyle.indexOf(' top:') == -1;
			prefCurLeft = prefStyle.indexOf(' left:') == -1;
			prefCurOffX = storage.offX || 20;
			prefCurOffY = storage.offY || 20;
		} else { //disable
			document.removeEventListener('mouseover', imgHover);
			//remove leftover div from page
			var data = document.getElementById('imgData');
			if(data)	data.parentNode.removeChild(data);
		}
	}

	browser.storage.local.get(['position', 'style', 'scale', 'enabled', 'offX', 'offY'], setPrefs);
}

//reload preferences from browser local storage at startup and page focus
loadPreferences();
window.addEventListener('focus', loadPreferences);

function checkMessage(request) {
	if(request.imgDataState == 'update')
		loadPreferences();
}
//reload extension when message is recieved from background script
browser.runtime.onMessage.addListener(checkMessage);