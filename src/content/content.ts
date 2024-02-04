// 設定変更時に設定を反映する
let settings: Settings | null = null;
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.action === ACTION_UPDATE_SETTINGS) {
        chrome.runtime.sendMessage({ action: ACTION_GET_SETTINGS }, (response) => {
            if (response && response.settings) {
                settings = response.settings;
            }

            // 謎エラー対応
            // https://stackoverflow.com/questions/72494154/a-listener-indicated-an-asynchronous-response-by-returning-true-but-the-messag
            return true;
        });
    }
});

// ページ読み込み時に設定を取得する
chrome.runtime.sendMessage({ action: ACTION_GET_SETTINGS }, (response) => {
    if (response && response.settings) {
        settings = (response.settings as Settings)!;

        setupContents();
        addDiceButton(settings);
    }
});
