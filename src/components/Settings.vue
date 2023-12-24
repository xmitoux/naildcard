<script setup lang="ts">
import { ACTION_UPDATE_SETTINGS } from '@/constants/chrome';
import { NAI_URL } from '@/constants/nai';

// eslint-disable-next-line no-undef
type GeneralSettings = Omit<Settings, 'wildcards'>;
const currentSettings = ref<GeneralSettings>({
    naildcardEnabled: false,
    prompt: '',
});

onMounted(async () => {
    const { wildcards: _, ...storageSettings } = await chrome.storage.sync.get();
    currentSettings.value = { ...currentSettings.value, ...storageSettings };
});

const saveSettings = async () => {
    await chrome.storage.sync.set(currentSettings.value);

    const [tab] = await chrome.tabs.query({ url: NAI_URL });
    if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_UPDATE_SETTINGS });
    }
};
</script>

<template>
    <h1>Naildcard Settings</h1>
    <el-form inline label-position="top" label-width="250px">
        <el-form-item label="Enabled">
            <el-switch v-model="currentSettings.naildcardEnabled" @change="saveSettings" />
        </el-form-item>
    </el-form>

    <el-form label-position="top" label-width="250px">
        <el-form-item label="Prompt Template">
            <el-input
                v-model="currentSettings.prompt"
                :autosize="{ minRows: 10 }"
                type="textarea"
                @change="saveSettings"
            />
        </el-form-item>
    </el-form>
</template>
