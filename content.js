let intervalId = null;

function ineterval(items) {
    if (items.enabled && items.interval > 0) {
        const wildcards = parseWildcardsString(items.wildcards);

        intervalId = setInterval(function() {
            const textbox = document.getElementsByClassName(items.className)[0];
            if (textbox != null) {
                const stringToInsert = createPrompt(items.prompt, wildcards);
                textbox.value = stringToInsert;
            }
        }, items.interval * 1000);
    }
}

// ページ読み込み時に起動する
chrome.storage.sync.get(null, function(items) {
    ineterval(items);
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    // Clear the existing interval
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
    }

    // Fetch the latest settings and start a new interval if enabled
    chrome.storage.sync.get(null, ineterval);
});
