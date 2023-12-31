<script setup lang="ts">
import {
    ElButton,
    ElForm,
    ElFormItem,
    ElOption,
    ElSelect,
    ElSpace,
    ElSwitch,
    ElTabPane,
    ElTabs,
} from 'element-plus';
import { Postcard, Memo, Edit } from '@element-plus/icons-vue';
import PromptTextarea from '@/components/PromptTextarea.vue';
import WildcardManager from '@/components/WildcardManager.vue';
import DanbooruTagHelper from '@/components/DanbooruTagHelper.vue';

const currentSettings = ref<Settings>({
    naildcardEnabled: false,
    prompt: '',
    wildcards: '',
    danbooruTagHistories: '[]',
});

onMounted(async () => {
    const storageSettings = await chrome.storage.local.get();
    currentSettings.value = { ...currentSettings.value, ...storageSettings };
});

const saveSettings = async () => {
    await chrome.storage.local.set(currentSettings.value);

    const [tab] = await chrome.tabs.query({ url: NAI_URL });
    if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_UPDATE_SETTINGS });
    }
};

const savePrompt = (changedPrompt: string) => {
    currentSettings.value.prompt = changedPrompt;
    saveSettings();
};

const isWildcardManagerMode = ref(true);

const saveWildcard = (changedWildcard: string) => {
    currentSettings.value.wildcards = changedWildcard;
    saveSettings();
};

const promptTextareaRef = ref<PromptTextareaRef>(null);
const danbooruTagHelperRef = ref<InstanceType<typeof DanbooruTagHelper>>();

const danbooruTag = ref('');
const onSelectDanbooruTag = (tag: string) => {
    danbooruTag.value = tag;
};

const formatedDanbooruTag = computed(() => {
    return danbooruTag.value.replaceAll('(', '\\(').replaceAll(')', '\\)');
});

const moveFocusAfterTagInsertion = ref(false);
const commaInsertPosition = ref<TagCommaPosition>('Auto');
const commaInsertPositions: TagCommaPosition[] = [
    'Auto',
    'Before Tag',
    'After Tag',
    'Both Sides of Tag',
    'None',
];

const insertDanbooruTagToPrompt = () => {
    insertDanbooruTagToTextarea(
        formatedDanbooruTag.value,
        promptTextareaRef.value,
        (tagInsertedPrompt: string) => (currentSettings.value.prompt = tagInsertedPrompt),
        moveFocusAfterTagInsertion.value,
        commaInsertPosition.value,
    );
    afterInsertionDanbooruTag();
};

const insertDanbooruTagToWildcard = () => {
    wildcardManagerRef.value?.insertDanbooruTag(
        formatedDanbooruTag.value,
        moveFocusAfterTagInsertion.value,
        commaInsertPosition.value,
    );
    afterInsertionDanbooruTag();
};

const afterInsertionDanbooruTag = () => {
    danbooruTagHelperRef.value?.clearTag();

    if (!moveFocusAfterTagInsertion.value) {
        danbooruTagHelperRef.value?.focus();
    }
};

const wildcardManagerRef = ref<InstanceType<typeof WildcardManager>>();

const referToWiki = () => {
    const tagWithUnderscore = danbooruTag.value.replaceAll(' ', '_');
    const url = `${DANBOORU_URL}/${tagWithUnderscore}`;
    window.open(url, '_blank');
    // 存在しないタグの場合でも、Danbooru側でnot exists表示になって特に問題ないので何もしない
};

const onChangeDanbooruTagHistories = (tags: DanbooruTag[]) => {
    // storage APIが配列で保存できない(オブジェクト化されてしまう)ので、JSONにシリアライズしてから保存する
    currentSettings.value.danbooruTagHistories = JSON.stringify(tags);
    saveSettings();
};

type TabName = 'Prompt' | 'Wildcard';
const activeTabName = ref<TabName>('Prompt');
</script>

<template>
    <h1>⚙️ Naildcard Settings</h1>
    <ElForm inline label-position="top" label-width="250px">
        <ElFormItem label="Enabled">
            <ElSwitch v-model="currentSettings.naildcardEnabled" @change="saveSettings" />
        </ElFormItem>
    </ElForm>

    <h2>📦 Danbooru Tag Helper</h2>

    <ElForm inline label-position="top">
        <ElFormItem label="Focus After Tag Insertion">
            <ElSwitch
                v-model="moveFocusAfterTagInsertion"
                inactive-text="Input"
                active-text="Prompt"
            />
        </ElFormItem>

        <ElFormItem label="Insert Comma At">
            <ElSelect v-model="commaInsertPosition" placeholder="Select">
                <ElOption
                    v-for="position in commaInsertPositions"
                    :key="position"
                    :label="position"
                    :value="position"
                />
            </ElSelect>
        </ElFormItem>
    </ElForm>

    <ElForm @submit.prevent>
        <ElFormItem>
            <ElSpace>
                <DanbooruTagHelper
                    ref="danbooruTagHelperRef"
                    :saved-tag-histories="currentSettings.danbooruTagHistories"
                    @change-histories="onChangeDanbooruTagHistories"
                    @select="onSelectDanbooruTag"
                />

                <template v-if="activeTabName === 'Prompt'">
                    <ElButton
                        :disabled="!danbooruTag"
                        :icon="Edit"
                        type="primary"
                        style="width: 200px"
                        v-show="activeTabName === 'Prompt'"
                        @click="insertDanbooruTagToPrompt"
                    >
                        Insert Tag to Prompt
                    </ElButton>
                </template>
                <template v-else>
                    <ElButton
                        :disabled="!danbooruTag || !wildcardManagerRef?.selectedWildcard"
                        :icon="Postcard"
                        type="success"
                        style="width: 200px"
                        v-show="activeTabName === 'Wildcard'"
                        @click="insertDanbooruTagToWildcard"
                    >
                        Insert Tag to Wildcard
                    </ElButton>
                </template>
                <ElButton :disabled="!danbooruTag" type="warning" :icon="Memo" @click="referToWiki">
                    Refer to Wiki
                </ElButton>
            </ElSpace>
        </ElFormItem>
    </ElForm>

    <ElTabs v-model="activeTabName" type="card">
        <ElTabPane label="📝Dynamic Prompt" name="Prompt">
            <PromptTextarea
                ref="promptTextareaRef"
                :prompt-text-prop="currentSettings.prompt"
                :rows="20"
                @change="savePrompt"
            />
        </ElTabPane>

        <ElTabPane label="🃏Wildcard" name="Wildcard">
            <ElForm label-position="top">
                <ElFormItem label="Editor Mode">
                    <ElSwitch
                        v-model="isWildcardManagerMode"
                        inactive-text="Simple"
                        active-text="Manager"
                    />
                </ElFormItem>
            </ElForm>

            <template v-if="isWildcardManagerMode">
                <WildcardManager
                    ref="wildcardManagerRef"
                    :wildcards-string-prop="currentSettings.wildcards"
                    @change="saveWildcard"
                />
            </template>

            <template v-else>
                <PromptTextarea
                    :prompt-text-prop="currentSettings.wildcards"
                    :rows="20"
                    @change="saveWildcard"
                />
            </template>
        </ElTabPane>
    </ElTabs>
</template>
