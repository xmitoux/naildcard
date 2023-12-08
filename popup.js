document.addEventListener('DOMContentLoaded', function() {
    // Get the settings from storage
    chrome.storage.sync.get(null, function(items) {
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError);
        } else {
            // Use the settings to set the form's state
            let form = document.getElementById('settingsForm');
            form.enabled.checked = items.enabled;
            form.interval.value = items.interval;
            form.className.value = items.className;
            form.prompt.value = items.prompt;
            form.wildcards.value = items.wildcards;
        }
    });

    // Save the settings whenever they're updated
    let form = document.getElementById('settingsForm');
    form.addEventListener('change', function() {
        let items = {
            enabled: form.enabled.checked,
            interval: form.interval.value,
            className: form.className.value,
            prompt: form.prompt.value,
            wildcards: form.wildcards.value
        };
        chrome.storage.sync.set(items, function() {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            }
        });
    });
});
