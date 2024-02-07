<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import {
    ElButton,
    ElCol,
    ElForm,
    ElFormItem,
    ElOption,
    ElRow,
    ElSelect,
    ElSpace,
    ElSwitch,
    ElTabPane,
    ElTabs,
    ElUpload,
    UploadRequestHandler,
    UploadRequestOptions,
} from 'element-plus';
import {
    Postcard,
    Memo,
    Edit,
    MagicStick,
    Sunny,
    Moon,
    Upload,
    Download,
} from '@element-plus/icons-vue';
import PromptTextarea from '@/components/PromptTextarea.vue';
import WildcardManager from '@/components/WildcardManager.vue';
import DanbooruTagHelper from '@/components/DanbooruTagHelper.vue';
import { DANBOORU_URL } from '@/constants/danbooru';
import { insertDanbooruTagToTextarea } from '@/utils/utils';
import { getStorage, saveStorage } from '@/utils/chrome-api';
import { defaultSettings } from '@/background';
import { useFileImportExport } from '@/composables/useFileImportExport';
import PngInfo from '@/components/PngInfo.vue';

const isDark = useDark();
const toggleDark = useToggle(isDark);
const darkMode = ref(isDark.value);

const currentSettings = ref<Settings>(defaultSettings);

onMounted(() => {
    getStorage((settings) => {
        currentSettings.value = { ...currentSettings.value, ...settings };
    });
});

const saveSettings = () => {
    saveStorage(currentSettings.value);
};

const savePrompt = (changedPrompt: string) => {
    currentSettings.value.prompt = changedPrompt;
    saveSettings();
};

const saveWildcard = (changedWildcard: WildcardMap) => {
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
    // (), <>をエスケープする
    return danbooruTag.value
        .replaceAll('(', '\\(')
        .replaceAll(')', '\\)')
        .replaceAll('<', '\\<')
        .replaceAll('>', '\\>');
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

const insertDanbooruTagToPrompt = (forceMoveFocus: boolean = false) => {
    insertDanbooruTagToTextarea(
        formatedDanbooruTag.value,
        promptTextareaRef.value,
        (tagInsertedPrompt: string) => (currentSettings.value.prompt = tagInsertedPrompt),
        forceMoveFocus || moveFocusAfterTagInsertion.value,
        commaInsertPosition.value,
    );
    afterInsertionDanbooruTag(forceMoveFocus);
};

const insertDanbooruTagToWildcard = (forceMoveFocus: boolean = false) => {
    wildcardManagerRef.value?.insertDanbooruTag(
        formatedDanbooruTag.value,
        forceMoveFocus || moveFocusAfterTagInsertion.value,
        commaInsertPosition.value,
    );
    afterInsertionDanbooruTag(forceMoveFocus);
};

const afterInsertionDanbooruTag = (forceMoveFocus: boolean) => {
    danbooruTagHelperRef.value?.clearTag();

    if (!forceMoveFocus && !moveFocusAfterTagInsertion.value) {
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

const formatPrompt = () => {
    if (!currentSettings.value.prompt.trim()) {
        return;
    }

    const normalizeCommas = (input: string): string => {
        // まずは末尾の不要な改行を削除
        input = input.trim();

        return input
            .split('\n')
            .map((line) => {
                if (!line) {
                    return '';
                }

                // 各行を処理
                line = line.trim(); // 末尾の空白を削除
                if (!line.endsWith(',')) {
                    line += ','; // 末尾がカンマでなければ、カンマを付加
                }
                return line.replace(/\s*,\s*/g, ', '); // 不要なスペースを整理
            })
            .join('\n'); // 改行で結合して戻す
    };

    const removeCommasBeforeCharacters = (input: string): string => {
        // 指定した文字の直前にあるカンマを削除する
        return input.replace(/,\s*([}\])>|])/g, '$1');
    };

    const format1 = normalizeCommas(currentSettings.value.prompt);
    const format2 = removeCommasBeforeCharacters(format1);

    savePrompt(format2);
};

const searchOnlyGeneralTags = ref(true);

const onSendDanbooruTag = (tag: string, forceMoveFocus: boolean) => {
    onSelectDanbooruTag(tag);

    if (activeTabName.value === 'Prompt') {
        insertDanbooruTagToPrompt(forceMoveFocus);
    } else {
        insertDanbooruTagToWildcard(forceMoveFocus);
    }
};

const onIntelliSense = () => {
    danbooruTagHelperRef.value?.focus();
};

const { importSettings, exportSetting, fileList } = useFileImportExport();
const importPrompt: UploadRequestHandler = async (options: UploadRequestOptions) => {
    const loadPrompt = (prompt: string, settings: Settings) => {
        settings.prompt = prompt;
        return settings;
    };

    currentSettings.value = await importSettings(options.file, loadPrompt);
};

const exportPrompt = () => exportSetting(currentSettings.value.prompt, 'dynamic-prompt');
</script>

<template>
    <div style="height: 20vh">
        <ElRow>
            <ElCol :span="7">
                <h2>⚙️ Naildcard Settings</h2>
                <ElForm inline label-position="top" label-width="250px">
                    <ElFormItem label="Enabled">
                        <ElSwitch
                            v-model="currentSettings.naildcardEnabled"
                            @change="saveSettings"
                        />
                    </ElFormItem>

                    <ElFormItem label="Dark Mode">
                        <ElSwitch
                            v-model="darkMode"
                            :active-action-icon="Moon"
                            :inactive-action-icon="Sunny"
                            @change="toggleDark()"
                        />
                    </ElFormItem>
                </ElForm>
            </ElCol>
            <ElCol :span="17">
                <h2>📦 Danbooru Tag Helper</h2>

                <ElForm inline label-position="top">
                    <ElFormItem label="Focus After Tag Insertion">
                        <ElSwitch
                            v-model="moveFocusAfterTagInsertion"
                            inactive-text="Input"
                            active-text="Prompt"
                        />
                    </ElFormItem>

                    <ElFormItem label="Search Only General Tags">
                        <ElSwitch v-model="searchOnlyGeneralTags" />
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
                                :options="{ searchOnlyGeneralTags }"
                                @change-histories="onChangeDanbooruTagHistories"
                                @select="onSelectDanbooruTag"
                                @send="onSendDanbooruTag"
                            />

                            <template v-if="activeTabName === 'Prompt'">
                                <ElButton
                                    :class="{ 'dark-button-primary': isDark }"
                                    :disabled="!danbooruTag"
                                    :icon="Edit"
                                    type="primary"
                                    style="width: 200px"
                                    v-show="activeTabName === 'Prompt'"
                                    @click="insertDanbooruTagToPrompt()"
                                >
                                    Insert Tag to Prompt
                                </ElButton>
                            </template>
                            <template v-else>
                                <ElButton
                                    :class="{ 'dark-button-success': isDark }"
                                    :disabled="
                                        !danbooruTag || !wildcardManagerRef?.selectedWildcard
                                    "
                                    :icon="Postcard"
                                    type="success"
                                    style="width: 200px"
                                    v-show="activeTabName === 'Wildcard'"
                                    @click="insertDanbooruTagToWildcard()"
                                >
                                    Insert Tag to Wildcard
                                </ElButton>
                            </template>
                            <ElButton
                                :class="{ 'dark-button-warning': isDark }"
                                :disabled="!danbooruTag"
                                type="warning"
                                :icon="Memo"
                                @click="referToWiki"
                            >
                                Refer to Wiki
                            </ElButton>
                        </ElSpace>
                    </ElFormItem>
                </ElForm>
            </ElCol>
        </ElRow>
    </div>

    <div style="height: 70vh">
        <ElTabs v-model="activeTabName" type="card">
            <ElTabPane label="📝Dynamic Prompt" name="Prompt">
                <ElRow style="margin: 10px 0">
                    <ElButton
                        :class="{ 'dark-button-primary': isDark }"
                        :icon="MagicStick"
                        size="small"
                        type="primary"
                        @click="formatPrompt"
                    >
                        Format Prompt
                    </ElButton>

                    <ElButton
                        :class="{ 'dark-button-primary': isDark }"
                        :icon="Upload"
                        size="small"
                        type="primary"
                        @click="exportPrompt()"
                    >
                        Export Prompt
                    </ElButton>
                    <ElUpload
                        v-model:file-list="fileList"
                        accept=".txt"
                        :auto-upload="true"
                        :show-file-list="false"
                        :http-request="importPrompt"
                    >
                        <ElButton
                            :class="{ 'dark-button-primary': isDark }"
                            :icon="Download"
                            size="small"
                            type="primary"
                        >
                            Import Prompt
                        </ElButton>
                    </ElUpload>
                </ElRow>

                <PromptTextarea
                    ref="promptTextareaRef"
                    :prompt-text-prop="currentSettings.prompt"
                    @change="savePrompt"
                    @intellisense="onIntelliSense"
                />
            </ElTabPane>

            <ElTabPane label="🃏Wildcards" name="Wildcard">
                <WildcardManager
                    ref="wildcardManagerRef"
                    :wildcards="currentSettings.wildcards"
                    @change="saveWildcard"
                    @intellisense="onIntelliSense"
                />
            </ElTabPane>
            <ElTabPane label="ℹ️PNG Info" name="PNG Info"><PngInfo /></ElTabPane>
        </ElTabs>
    </div>
</template>

<style scoped>
.dark-button-primary {
    --el-button-bg-color: var(--el-color-primary-light-3);
    --el-button-border-color: var(--el-color-primary-light-5);
}

.dark-button-success {
    --el-button-bg-color: var(--el-color-success-light-3);
    --el-button-border-color: var(--el-color-success-light-5);
}

.dark-button-warning {
    --el-button-bg-color: var(--el-color-warning-light-3);
    --el-button-border-color: var(--el-color-warning-light-5);
}

:deep(.el-tabs__header) {
    margin: 0;
    user-select: none;
}
</style>
