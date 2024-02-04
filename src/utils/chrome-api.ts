import { ACTION_GET_SETTINGS } from '@/constants/chrome';

export const getStorage = (callback: (settings: Settings) => void) => {
    chrome.runtime.sendMessage({ action: ACTION_GET_SETTINGS }, (response) => {
        if (!response || !response.settings) {
            return;
        }

        callback(response.settings);
    });
};

export const saveStorage = (settings: Settings) => {
    chrome.storage.local.set(settings);
};
