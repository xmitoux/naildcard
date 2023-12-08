chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.create({url: "settings.html"});
});

chrome.storage.sync.get(null, function(items) {
    if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
    } else {
        // デフォルト値を設定する
        let defaultItems = {
            enabled: false,
            interval: 0,
            className: '',
            prompt: '',
            wildcards: ''
        };
        for (let key in defaultItems) {
            if (!items.hasOwnProperty(key)) {
                items[key] = defaultItems[key];
            }
        }
        // save the default values
        chrome.storage.sync.set(items, function() {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            }
        });
    }
});
