document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settingsForm');

    // Get the settings from storage
    chrome.storage.sync.get().then((items) => {
        form.rapidfireModeEnabled.checked = items.rapidfireModeEnabled || false;
        form.autoGeneratingEnabled.checked = false;  // 自動生成はデフォルトOFF
        form.autoGeneratingInterval.value = items.autoGeneratingInterval || 20;
        form.autoAdjustingAspectRatio.checked = items.autoAdjustingAspectRatio || false;
        form.prompt.value = items.prompt || '';
        form.wildcards.value = items.wildcards || '';
    });
    
    // Save the settings whenever they're updated
    form.addEventListener('change', async () => {
        let settings = {
            rapidfireModeEnabled: form.rapidfireModeEnabled.checked,
            autoGeneratingEnabled: form.autoGeneratingEnabled.checked,
            autoGeneratingInterval: form.autoGeneratingInterval.value,
            autoAdjustingAspectRatio: form.autoAdjustingAspectRatio.checked,
            prompt: form.prompt.value,
            wildcards: form.wildcards.value
        };
    
        // Save the settings
        chrome.storage.sync.set(settings).then(async () => {
            const [tab] = await chrome.tabs.query({url: 'https://novelai.net/*'});
            await chrome.tabs.sendMessage(tab.id, {action: 'updateSettings'});
        });
    });
});
