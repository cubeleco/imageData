function toggleExtension() {
	//get current enabled state
	browser.storage.local.get('enabled', toggleState);
}
function toggleState(result) {
	var state = (typeof result.enabled == 'undefined')? false : !result.enabled;

	browser.storage.local.set({
		enabled: state
	});
	updateIcon(state);
	//send message to content script to update its state
	browser.tabs.query({currentWindow: true, active: true}, function(tabs) {
		browser.tabs.sendMessage(tabs[0].id, {imgDataState: "update"});
	});	
}

function updateIcon(state) {
	browser.browserAction.setIcon({	path: state? 'icons/thumb-48.png' : 'icons/disable-48.png'	});
}
function initIcon(result) {
	updateIcon((typeof result.enabled == 'undefined')? true : result.enabled);
}
//toggle extension when toolbar button is clicked
browser.browserAction.onClicked.addListener(toggleExtension);
//on browser startup get prior state
browser.storage.local.get('enabled', initIcon);