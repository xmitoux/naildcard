chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({url: 'settings.html'});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.sync.get().then((items) => {
            sendResponse({ settings: items });
        });
        return true;
    }
});
