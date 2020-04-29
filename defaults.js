//extension option storage
var prefs = {};

function loadPrefs(callback) {
	chrome.storage.local.get({
		enabled: true,
		holdEnableKey: {
			key: 'disabled'
		},
		position: 0,
		fsdivision: 1024,
		fsprecision: 10,
		delay: 0,
		style: 'color: white; background-color: rgba(0,0,10, 0.8); font: 1rem Arial, Helvetica, sans-serif; padding: 2px 5px; border-radius: 5px;',
		alt: false,
		scale: false,
		offX: 20,
		offY: 20,
		curLeft: true,
		curTop: true,
		minWidth: 0,
		minHeight: 0
	}, callback);
}
