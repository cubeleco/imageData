//example css styles
const defaultStyle = 'color: rgba(255,255,255,1.0); background: rgba(0,0,20,0.8); font: 1.2em Arial, Helvetica, sans-serif; padding: 4px; border-radius: 2px;';
const exampleStyle1 = 'color: white; background: #07ac; font: 17px Impact, FreeSans, sans-serif; border-radius: 10px; padding: 0 10px; text-align: center; text-shadow: 2px 2px 2px #000d;';
const exampleStyle2 = 'color: white; background: black url(https://c2.staticflickr.com/6/5547/14401060837_e56c5f1d7c.jpg) 50% 60%/150%; font: bold 1.4em "Ubuntu Condensed", "Latin Modern Math", Georgia, sans-serif; border-radius: 4px 30px; padding: 0px 10px 0px 10px; text-align: right; text-shadow: 3px 1px 3px black; box-shadow: 3px 2px 3px black;';
const exampleStyle3 = 'color: white; background: black url("https://upload.wikimedia.org/wikipedia/commons/e/e7/198690-texture.jpg") repeat scroll 30% 60% / 120% auto; font: 1.3em Ubuntu, Monospace, sans-serif; text-shadow: rgba(0,0,0, 0.9) 0px 0px 3px; border: 4px outset #fff4; border-radius: 20px 0px; padding: 0px 8px 0px 5px;';

function posChange() {
	var pos = parseInt(document.getElementById('infoPos').value);
	browser.storage.local.set({
		position: pos
	});
	updatePos(pos);
}
function updatePos(val) {
	//if follow cursor or tooltip show offset settings
	document.getElementById('infoCurOffset').style.display = (val == 2 || val == 5) ? 'inline' : 'none';
}

function styleChange() {
	var sty = document.getElementById('infoStyle').value;
	browser.storage.local.set({
		style: sty
	});
	updateStyle(sty);
}
function updateStyle(val) {
	//update preview
	document.getElementById('previewDiv').style.cssText = val;
}

function scaleChange() {
	var scl = document.getElementById('infoScale').checked;
	browser.storage.local.set({
		scale: scl
	});
	updateScale(scl);
}
function updateScale(val) {
	//change visibility of scale in preview
	document.getElementById('previewScale').style.display = (val) ? 'inline':'none';
}

function offXChange() {
	browser.storage.local.set({
		offX: parseInt(document.getElementById('infoOffX').value)
	});
}
function offYChange() {
	browser.storage.local.set({
		offY: parseInt(document.getElementById('infoOffY').value)
	});
}

function copyStyle() {
	document.getElementById('infoStyle').value = this.style.cssText;
	styleChange();
}

function restoreOptions() {
	//set styles of examples
	document.getElementById('defaultDiv').style.cssText = defaultStyle;
	document.getElementById('exampleDiv1').style.cssText = exampleStyle1;
	document.getElementById('exampleDiv2').style.cssText = exampleStyle2;
	document.getElementById('exampleDiv3').style.cssText = exampleStyle3;

	function setPrefs(result) {
		var position = result.position || 0;
		document.getElementById('infoPos').value = position;
		updatePos(position);
		
		var style = result.style || defaultStyle;
		document.getElementById('infoStyle').value = style;
		updateStyle(style);
		
		var scale = result.scale || false;
		document.getElementById('infoScale').checked = scale;
		updateScale(scale);

		//cursor x/y offsets
		document.getElementById('infoOffX').value = result.offX || 20;
		document.getElementById('infoOffY').value = result.offY || 20;
	}
	function onError(error) {
		console.log('Error loading preferences: '+error);
	}

	browser.storage.local.get(['position', 'style', 'scale', 'offX', 'offY'], setPrefs);
}


document.addEventListener('DOMContentLoaded', restoreOptions);
//settings input
document.getElementById('infoPos').addEventListener('input', posChange);
document.getElementById('infoStyle').addEventListener('input', styleChange);
document.getElementById('infoScale').addEventListener('change', scaleChange);
document.getElementById('infoOffX').addEventListener('input', offXChange);
document.getElementById('infoOffY').addEventListener('input', offYChange);
//presets
document.getElementById('defaultDiv').addEventListener('click', copyStyle);
document.getElementById('exampleDiv1').addEventListener('click', copyStyle);
document.getElementById('exampleDiv2').addEventListener('click', copyStyle);
document.getElementById('exampleDiv3').addEventListener('click', copyStyle);