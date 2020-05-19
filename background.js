var enabled;
function toggleState() {
	enabled = !enabled;
	chrome.storage.local.set({ enabled: enabled });
}

function updateIcon() {
	chrome.browserAction.setIcon({ path: enabled? 'icons/thumb-48.png' : 'icons/disable-48.png' });
	chrome.browserAction.setTitle({	title: enabled? 'Image Data (on)' : 'Image Data (off)' });
}
function stateChanged(changes) {
	//only update on enabled change
	if(changes.enabled) {
		//reset to enabled state on factory reset otherwise use newValue
		enabled = changes.enabled.newValue === undefined ? true : changes.enabled.newValue;
		updateIcon();
	}
}
function readStorage(storage) {
	enabled = storage.enabled;
	updateIcon();
}
//toggle enabled when toolbar button is clicked
chrome.browserAction.onClicked.addListener(toggleState);
//update on enabled state change
chrome.storage.onChanged.addListener(stateChanged);
//on browser startup get prior state
chrome.storage.local.get({enabled: true}, readStorage);
