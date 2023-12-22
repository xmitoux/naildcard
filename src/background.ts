import { ACTION_GET_SETTINGS } from '@/constants/chrome';

const defaultSettings: Settings = {
    naildcardEnabled: false,
    prompt: '',
    wildcards: '',
};

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'index.html' });

    chrome.storage.sync.get().then((settings) => {
        if (!Object.keys(settings).length) {
            // インストール直後は設定が無なのでデフォルト値を設定
            chrome.storage.sync.set(defaultSettings);
        }
    });
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.action === ACTION_GET_SETTINGS) {
        chrome.storage.sync.get().then((settings) => {
            sendResponse({ settings: settings });
        });

        return true;
    }
});
