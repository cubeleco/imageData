const defaultStyle = 'color: white; background-color: rgba(0,0,10,0.8); font: 1.2em Arial, Helvetica, sans-serif; padding: 4px 5px; border-radius: 5px;';
const exampleStyle1 = 'color: rgb(255,255,255); background-color: #07ac; font: 17px Impact, FreeSans, sans-serif; border-radius: 10px; padding: 0 10px; text-align: center; text-shadow: 2px 2px 2px #000d;';
const exampleStyle2 = 'color: white; background: black url(https://c2.staticflickr.com/6/5547/14401060837_e56c5f1d7c.jpg) 50% 60%/150%; font: bold 1.4em "Ubuntu Condensed", "Latin Modern Math", Georgia, sans-serif; border-radius: 4px 30px; padding: 0px 10px 0px 10px; text-align: right; text-shadow: 3px 1px 3px black; box-shadow: 3px 2px 3px black;';
const exampleStyle3 = 'color: white; background: black url(https://upload.wikimedia.org/wikipedia/commons/e/e7/198690-texture.jpg) repeat scroll 30% 60% / 120% auto; font: 1.3em Ubuntu, Monospace, sans-serif; text-shadow: rgba(0,0,0, 0.9) 0px 0px 3px; border: 4px outset #fff4; border-radius: 20px 0px; padding: 0px 8px 0px 5px;';

//saving and updating settings functions
function posChange(event) {
	var pos = parseInt(event.target.value);
	chrome.storage.local.set({
		position: pos
	});
	posUpdate(pos);
}
function posUpdate(val) {
	//if follow cursor or tooltip: show offset settings
	document.getElementById('settCurOffset').style.display = (val === 2 || val === 5) ? 'inline' : 'none';
}
function divChange(event) {
	chrome.storage.local.set({
		fsdivision: parseInt(event.target.value)
	});
}

function styleChange(event) {
	var sty = event.target.value;
	chrome.storage.local.set({
		style: sty
	});
	styleUpdate(sty);
}
function styleUpdate(val) {
	//update preview
	document.getElementById('previewDiv').style.cssText = val;
}
function styleCopy(event) {
	var elem = document.getElementById('settStyle');
	//copy preset style to text box
	elem.value = event.target.style.cssText;
	//force input event to save style and update preview
	elem.dispatchEvent(new Event('input'));
}

function altChange(event) {
	var altT = event.target.checked;
	chrome.storage.local.set({
		alt: altT
	});
	altUpdate(altT);
}
function altUpdate(val) {
	//change visibility of scale in preview
	document.getElementById('previewAlt').style.display = (val) ? 'inline':'none';
}
function scaleChange(event) {
	var scl = event.target.checked;
	chrome.storage.local.set({
		scale: scl
	});
	scaleUpdate(scl);
}
function scaleUpdate(val) {
	//change visibility of scale in preview
	document.getElementById('previewScale').style.display = (val) ? 'inline':'none';
}

function offXChange(event) {
	chrome.storage.local.set({
		offX: parseInt(event.target.value)
	});
}
function offYChange(event) {
	chrome.storage.local.set({
		offY: parseInt(event.target.value)
	});
}


function setPrefs(storage) {
	var position = storage.position || 0;
	document.getElementById('settPos').value = position;
	posUpdate(position);
	
	document.getElementById('settDiv').value = storage.fsdivision || 1024;
	
	var style = storage.style || defaultStyle;
	document.getElementById('settStyle').value = style;
	styleUpdate(style);
	
	var alt = storage.alt || false;
	document.getElementById('settAlt').checked = alt;
	altUpdate(alt);
	
	var scale = storage.scale || false;
	document.getElementById('settScale').checked = scale;
	scaleUpdate(scale);

	//cursor x/y offsets
	document.getElementById('settOffX').value = storage.offX || 20;
	document.getElementById('settOffY').value = storage.offY || 20;
}
function restoreOptions() {
	//set styles of examples
	document.getElementById('defaultDiv').style.cssText = defaultStyle;
	document.getElementById('exampleDiv1').style.cssText = exampleStyle1;
	document.getElementById('exampleDiv2').style.cssText = exampleStyle2;
	document.getElementById('exampleDiv3').style.cssText = exampleStyle3;

	chrome.storage.local.get(['position', 'fsdivision', 'style', 'alt', 'scale', 'offX', 'offY'], setPrefs);
}


document.addEventListener('DOMContentLoaded', restoreOptions);
//settings input
document.getElementById('settPos').addEventListener('input', posChange);
document.getElementById('settDiv').addEventListener('input', divChange);
document.getElementById('settStyle').addEventListener('input', styleChange);
document.getElementById('settAlt').addEventListener('change', altChange);
document.getElementById('settScale').addEventListener('change', scaleChange);
document.getElementById('settOffX').addEventListener('input', offXChange);
document.getElementById('settOffY').addEventListener('input', offYChange);
//presets styles
document.getElementById('defaultDiv').addEventListener('click', styleCopy);
document.getElementById('exampleDiv1').addEventListener('click', styleCopy);
document.getElementById('exampleDiv2').addEventListener('click', styleCopy);
document.getElementById('exampleDiv3').addEventListener('click', styleCopy);