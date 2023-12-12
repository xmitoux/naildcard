const generateButtonClassName = 'sc-d72450af-1 sc-9aa632a0-20 kXFbYD ewHWpb';
const aspectRatioButtonClassName = 'sc-876067fe-0 sc-876067fe-109 flOuWA kJmrNK';

// ページ読み込み時に設定を取得する
let settings = null;
chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.settings) {
        settings = response.settings;

        // 自動生成はデフォルトOFF
        settings.autoGeneratingEnabled = false;
        
        // 以降のsetIntervalコールバックが参照するsettingsはupdateSettingsリスナーで更新される

        // rapidfireの開始
        setInterval(() => {
            if (settings.rapidfireModeEnabled && isPositivePromptInputVisible()) {
                // ポジティブプロンプト欄が表示中ならプロンプトを入力する
                try {
                    insertPrompt(settings.prompt, settings.wildcards);
                } catch (error) {
                    console.error("insertPromptに失敗:", error.message);
                }
            }
        }, 1000);

        // auto generatingの開始
        // setInterval時に周期を決定するため、途中での設定変更はページ再読み込みが必要
        setInterval(() => {
            if (!settings.autoGeneratingEnabled || settings.autoGeneratingInterval <= 0) {
                return;
            }
            
            const generateButton = document.getElementsByClassName(generateButtonClassName)[0];
            if (generateButton) {
                generateButton.click();
            }

            if (!settings.autoAdjustingAspectRatio) {
                return;
            }

            const aspectRatioButton = document.getElementsByClassName(aspectRatioButtonClassName)[0];
            if (aspectRatioButton) {
                aspectRatioButton.click();
            }
        }, settings.autoGeneratingInterval * 1000);

        // サイコロボタン表示を待機しオーバーライド
        const overrideDiceInterval = setInterval(() => {
            if (overrideDiceButton(() => {
                try {
                    // TODO: ONOFF設定を入れる
                    // (ただし元のclickイベントを復元しようがないので再読み込みでしか反映できない)
                    insertPrompt(settings.prompt, settings.wildcards);
                } catch (error) {
                    console.error("insertPromptに失敗:", error.message);
                }
            })) {
                clearInterval(overrideDiceInterval);
            };
        }, 1000)
    }
});

// 設定変更時に設定を反映する
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (response && response.settings) {
                settings = response.settings;
            }

            // 謎エラー対応
            // https://stackoverflow.com/questions/72494154/a-listener-indicated-an-asynchronous-response-by-returning-true-but-the-messag
            return true;
        });
    }
});

