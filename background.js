function toggleExtension() {
	//get current enabled state then toggle its state
	chrome.storage.local.get({enabled: true}, toggleState);
}
function toggleState(storage) {
	chrome.storage.local.set({ enabled: !storage.enabled });
}

function updateIcon(state) {
	chrome.browserAction.setIcon({ path: state? 'icons/thumb-48.png' : 'icons/disable-48.png' });
	chrome.browserAction.setTitle({	title: state? 'Image Data (on)' : 'Image Data (off)' });
}
function stateChanged(changes) {
	//only update on enabled change
	if(changes.enabled)
		//reset to enabled state on factory reset otherwise use newValue
		updateIcon(changes.enabled.newValue === undefined ? true : changes.enabled.newValue);
}
function readStorage(storage) {
	updateIcon(storage.enabled);
}
//toggle enabled when toolbar button is clicked
chrome.browserAction.onClicked.addListener(toggleExtension);
//update on enabled state change
chrome.storage.onChanged.addListener(stateChanged);
//on browser startup get prior state
chrome.storage.local.get({enabled: true}, readStorage);
