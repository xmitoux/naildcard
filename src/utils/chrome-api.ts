import { ACTION_GET_SETTINGS } from '@/constants/chrome';

export const getStorage = (callback: (settings: Settings) => void) => {
    chrome.runtime.sendMessage({ action: ACTION_GET_SETTINGS }, (response) => {
        if (!response || !response.settings) {
            return true;
        }

        // Storage APIでは配列がオブジェクトに変換されているので配列に変換する
        const wildcardsOrg = response.settings.wildcards;
        const wildcardsValueToArray = { ...wildcardsOrg };
        Object.keys(wildcardsValueToArray).forEach((wildcardKey) => {
            wildcardsValueToArray[wildcardKey] = Object.keys(
                wildcardsValueToArray[wildcardKey],
            ).map((arrayIndex) => wildcardsValueToArray[wildcardKey][arrayIndex]);
        });
        response.settings.wildcards = wildcardsValueToArray;

        callback(response.settings);
    });
};

export const saveStorage = (settings: Settings) => {
    chrome.storage.local.set(settings);
};
