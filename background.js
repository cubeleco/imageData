function toggleExtension() {
	//get current enabled state
	chrome.storage.local.get('enabled', toggleState);
}
function toggleState(storage) {
	//disable state on first toggle since default is enabled
	const state = (typeof storage.enabled === 'undefined')? false : !storage.enabled;

	chrome.storage.local.set({
		enabled: state
	});
	updateIcon(state);
}

function updateIcon(state) {
	chrome.browserAction.setIcon({	path: state? 'icons/thumb-48.png' : 'icons/disable-48.png'	});
	chrome.browserAction.setTitle({	title: state? 'Image Data (Enabled)' : 'Image Data (Disabled)'	});
}
function initIcon(storage) {
	updateIcon((typeof storage.enabled === 'undefined')? true : storage.enabled);
}
//toggle extension when toolbar button is clicked
chrome.browserAction.onClicked.addListener(toggleExtension);
//on browser startup get prior state
chrome.storage.local.get('enabled', initIcon);