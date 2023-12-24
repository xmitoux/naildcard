import {
    createDynamicPromptButton,
    isNegativePromptVisible,
    insertPrompt,
} from '@/content/content-scripts';
import { ACTION_GET_SETTINGS, ACTION_UPDATE_SETTINGS } from '@/constants/chrome';

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

        if (!settings.naildcardEnabled) {
            // 設定がOFFならサイコロボタンを表示しない
            return;
        }

        // 以降のsetIntervalコールバックが参照するsettingsはupdateSettingsリスナーで更新される

        // 生成ボタン表示を待機しサイコロボタンを表示
        const inteval = setInterval(() => {
            if (
                createDynamicPromptButton(() => {
                    if (!isNegativePromptVisible()) {
                        // ポジティブプロンプト欄が表示中なら入力する
                        try {
                            insertPrompt(settings!.prompt, settings!.wildcards);
                        } catch (error) {
                            console.error('insertPrompt failed:', (error as Error).message);
                        }
                    }
                })
            ) {
                clearInterval(inteval);
            }
        }, 1000);
    }
});
