<script setup lang="ts">
import { ref, computed, nextTick, watch, watchEffect } from 'vue';
import {
    Check,
    Checked,
    Close,
    DeleteFilled,
    Download,
    EditPen,
    List,
    Filter,
    Upload,
} from '@element-plus/icons-vue';
import {
    ElButton,
    ElButtonGroup,
    ElCol,
    ElEmpty,
    ElInput,
    ElMessage,
    ElPopconfirm,
    ElRow,
    ElScrollbar,
    ElUpload,
    UploadRequestHandler,
    UploadRequestOptions,
} from 'element-plus';
import PromptTextarea from '@/components/PromptTextarea.vue';
import { useClipboardCopy } from '@/composables/useClipboardCopy';
import { insertDanbooruTagToTextarea } from '@/utils/utils';
import { useDark } from '@vueuse/core';
import { useFileImportExport } from '@/composables/useFileImportExport';

const props = defineProps<{
    wildcards: WildcardMap;
}>();

const emit = defineEmits<{
    change: [changedWildcards: WildcardMap];
    intellisense: [];
}>();

const isDark = useDark();

// 親がタグ挿入を実行するためのexpose
const insertDanbooruTag = (
    tag: string,
    moveCaret: boolean,
    commaInsertPosition: TagCommaPosition,
) => {
    insertDanbooruTagToTextarea(
        tag,
        wildcardTextareaRef.value,
        (tagInsertedPrompt: string) => editWildcardString(tagInsertedPrompt),
        moveCaret,
        commaInsertPosition,
    );
};

const selectedWildcard = ref<string | null>(null);

defineExpose({
    insertDanbooruTag,
    selectedWildcard,
});

const wildcardsWork = ref<WildcardMap>({});

// 起動時の設定読み込みを監視
watchEffect(() => {
    wildcardsWork.value = props.wildcards;
});

const selectWildcard = (wildcardKey: string) => {
    selectedWildcard.value = wildcardKey;
};

const selectedWildcardString = computed<string>(() => {
    if (!selectedWildcard.value) {
        return '';
    }
    return wildcardsWork.value[selectedWildcard.value]?.join('\n') || '';
});

const isWildcardSelected = (wildcardKey: string) => wildcardKey === selectedWildcard.value;

const wildcardTextareaRef = ref<PromptTextareaRef>(null);
const newWildcardKey = ref<string>('');

const newWildcardKeyTrim = computed(() => newWildcardKey.value.trim());
const addNewWildcard = () => {
    if (addWildcard(newWildcardKeyTrim.value)) {
        saveWildcard();

        if (!sortedWildcard.value.includes(newWildcardKeyTrim.value)) {
            // 追加したワイルドカードがフィルタ結果に含まれない場合はフィルタを解除
            filterQuery.value = '';
        }

        newWildcardKey.value = '';
        nextTick(() => wildcardTextareaRef.value?.textareaRef.textarea.focus());
    }
};

const addWildcard = (addingWildcardKey: string): boolean => {
    if (!validateWildcardName(addingWildcardKey)) {
        return false;
    }

    wildcardsWork.value[addingWildcardKey] = [];
    selectedWildcard.value = addingWildcardKey;

    return true;
};

const invalidWildcardNameChars = ['(', ')', '<', '>', '$', '#', '__'];
const validateWildcardName = (name: string): boolean => {
    if (!name) {
        return false;
    }

    if (invalidWildcardNameChars.some((invalidChar) => name.includes(invalidChar))) {
        ElMessage.warning('Wildcard includes invalid chars!');
        return false;
    }

    if (Object.keys(wildcardsWork.value).includes(name)) {
        ElMessage.warning('Wildcard already exists!');
        return false;
    }

    return true;
};

const deleteWildcard = (wildcardKey: string) => {
    delete wildcardsWork.value[wildcardKey];
    saveWildcard();

    // ワイルドカード削除不具合対応
    // (textareaが空になることでchangeが発火し、selectedWildcardに空文字が残っていた)
    selectedWildcard.value = null;
};

const editWildcardString = (changedWildcardString: string) => {
    if (!selectedWildcard.value) {
        // ワイルドカード削除不具合対応
        // (削除後はselectedWildcardがないので更新しない)
        return;
    }

    const wildcardStrings = changedWildcardString.split('\n');
    wildcardsWork.value[selectedWildcard.value] = wildcardStrings;
    saveWildcard();
};

const saveWildcard = () => {
    emit('change', wildcardsWork.value);
};

const renamingWildcard = ref('');
const isWildcardRenaming = (wildcardKey: string) => {
    return wildcardKey === renamingWildcard.value;
};

const renamedWildcard = ref('');
const startRenamingWildcard = (wildcardKey: string) => {
    renamingWildcard.value = wildcardKey;
    renamedWildcard.value = wildcardKey;
};

const renameWildcardInputRef = ref<InstanceType<typeof ElInput>[] | null>(null);
watch(renameWildcardInputRef, () => {
    // リネーム時のオートフォーカス
    renameWildcardInputRef.value?.[0].focus();
});

const saveRenamingWildcard = (event: Event) => {
    if (renamedWildcard.value === renamingWildcard.value) {
        cancelRenamingWildcard();
        return;
    }

    if (addWildcard(renamedWildcard.value)) {
        wildcardsWork.value[renamedWildcard.value] = wildcardsWork.value[renamingWildcard.value];
        deleteWildcard(renamingWildcard.value);

        // リネーム後を選択状態にするために保持
        const renamedWildcardName = renamedWildcard.value;

        cancelRenamingWildcard();

        selectWildcard(renamedWildcardName);

        if (!sortedWildcard.value.includes(renamedWildcardName)) {
            // リネームしたワイルドカードがフィルタ結果に含まれない場合はフィルタを解除
            filterQuery.value = '';
        }

        // リネーム不具合対応
        // (確定ボタンをクリックするとpタグのclickイベントが発生し、リネーム前のゾンビが残る
        // 確定ボタンの@click.stopがなぜか効かないのでstopPropagation)
        event.stopPropagation();
    }
};

const cancelRenamingWildcard = () => {
    renamingWildcard.value = '';
    renamedWildcard.value = '';
    renameWildcardInputRef.value = null;
};

const filterQuery = ref('');
const sortedWildcard = computed<string[]>(() => {
    const wildcards = Object.keys(wildcardsWork.value);

    const filteredWildcards = wildcards.filter((wildcard: string): boolean => {
        const wildcardLowerCase = wildcard.toLowerCase();
        const query = filterQuery.value;

        let queryIndex = 0;
        for (let i = 0; i < wildcardLowerCase.length && queryIndex < query.length; i++) {
            if (wildcardLowerCase[i] === query[queryIndex]) {
                queryIndex++;
            }
        }
        return queryIndex === query.length;
    });

    return filteredWildcards.sort();
});

const onInputFilter = () => {
    if (selectedWildcard.value && !sortedWildcard.value.includes(selectedWildcard.value)) {
        // 選択中のワイルドカードがフィルタ結果に含まれない場合は選択を解除
        selectedWildcard.value = null;
    }
};

const onRenameInputFocus = () => {
    const input = renameWildcardInputRef.value![0].input!;
    input.selectionStart = 0;
    input.selectionEnd = renamingWildcard.value.length;
};

const { copying, copyToClipboard } = useClipboardCopy();

const { importSettings, exportSetting, fileList } = useFileImportExport();

const exportWildcards = () =>
    exportSetting(JSON.stringify(wildcardsWork.value), 'wildcards', 'json');
const importWildcards: UploadRequestHandler = async (options: UploadRequestOptions) => {
    selectedWildcard.value = null;
    cancelRenamingWildcard();

    const loadWildcard = (wildcardJson: string, settings: Settings) => {
        const wildcards = JSON.parse(wildcardJson);
        settings.wildcards = wildcards;
        return settings;
    };

    const importedSettings = await importSettings(options.file, loadWildcard);
    wildcardsWork.value = importedSettings.wildcards;
};

const onRenameInputBlur = () => {
    // リネーム確定ボタンクリックをキャンセルしないように非同期で実行
    setTimeout(() => {
        cancelRenamingWildcard();
    }, 80);
};
</script>

<template>
    <!-- 追加エリア -->
    <ElRow style="margin: 10px 0">
        <ElCol :span="5">
            <div style="margin-right: 5px">
                <ElInput
                    v-model="newWildcardKey"
                    clearable
                    placeholder="New Wildcard"
                    size="small"
                    @keydown.prevent.enter="addNewWildcard"
                >
                    <template #append>
                        <ElButton
                            :disabled="!newWildcardKeyTrim"
                            size="small"
                            @click="addNewWildcard"
                        >
                            Add
                        </ElButton>
                    </template>
                </ElInput>
            </div>
        </ElCol>

        <ElCol :span="4">
            <div style="margin-right: 5px">
                <ElInput
                    v-model="filterQuery"
                    clearable
                    placeholder="Filter Wildcard"
                    :prefix-icon="Filter"
                    size="small"
                    @input="onInputFilter"
                />
            </div>
        </ElCol>

        <ElButton
            v-show="sortedWildcard.length"
            :class="{ 'dark-button-success': isDark }"
            :icon="Upload"
            size="small"
            type="success"
            @click="exportWildcards"
        >
            Export
        </ElButton>
        <ElUpload
            v-model:file-list="fileList"
            accept=".json"
            :auto-upload="true"
            :show-file-list="false"
            :http-request="importWildcards"
        >
            <ElButton
                :class="{ 'dark-button-success': isDark }"
                :icon="Download"
                size="small"
                type="success"
            >
                Import
            </ElButton>
        </ElUpload>
    </ElRow>

    <ElRow>
        <!-- 選択エリア -->
        <ElCol :span="9">
            <div class="wildcards-container">
                <ElScrollbar max-height="65vh">
                    <p
                        v-for="wildcardKey in sortedWildcard"
                        :class="{
                            'wildcard-selected': isWildcardSelected(wildcardKey),
                            'wildcard-renaming': isWildcardRenaming(wildcardKey),
                        }"
                        :key="wildcardKey"
                        @click="selectWildcard(wildcardKey)"
                        @dblclick="startRenamingWildcard(wildcardKey)"
                    >
                        <!-- リネーム -->
                        <ElInput
                            v-if="isWildcardRenaming(wildcardKey)"
                            v-model="renamedWildcard"
                            @focus="onRenameInputFocus"
                            @keydown.prevent.enter="saveRenamingWildcard"
                            @keydown.prevent.esc="cancelRenamingWildcard"
                            ref="renameWildcardInputRef"
                            @blur="onRenameInputBlur"
                        />
                        <!-- wildcard名 -->
                        <span v-else>
                            {{ wildcardKey }}
                        </span>

                        <!-- 編集ボタン -->
                        <template v-if="isWildcardSelected(wildcardKey) && !renamingWildcard">
                            <span class="edit-buttons">
                                <ElButtonGroup type="info">
                                    <ElButton
                                        circle
                                        :icon="copying ? Checked : List"
                                        @click="copyToClipboard(`__${wildcardKey}__`)"
                                    />

                                    <ElButton
                                        circle
                                        :icon="EditPen"
                                        @click="startRenamingWildcard(wildcardKey)"
                                    />

                                    <ElPopconfirm
                                        title="Are you sure to delete?"
                                        :width="200"
                                        @confirm="deleteWildcard(wildcardKey)"
                                    >
                                        <template #reference>
                                            <ElButton circle :icon="DeleteFilled" type="danger" />
                                        </template>
                                    </ElPopconfirm>
                                </ElButtonGroup>
                            </span>
                        </template>

                        <template v-else-if="isWildcardRenaming(wildcardKey)">
                            <span class="edit-buttons">
                                <ElButtonGroup>
                                    <ElButton
                                        :icon="Check"
                                        type="success"
                                        circle
                                        @click.stop="saveRenamingWildcard"
                                    />
                                    <ElButton
                                        :icon="Close"
                                        type="info"
                                        circle
                                        @click.stop="cancelRenamingWildcard"
                                    />
                                </ElButtonGroup>
                            </span>
                        </template>
                    </p>
                </ElScrollbar>
            </div>
        </ElCol>

        <!-- 編集エリア -->
        <ElCol :span="15">
            <template v-if="selectedWildcard">
                <PromptTextarea
                    v-show="selectedWildcard"
                    ref="wildcardTextareaRef"
                    :prompt-text-prop="selectedWildcardString"
                    @change="editWildcardString"
                    @keydown.ctrl.space.prevent="emit('intellisense')"
                />
            </template>

            <div v-else class="empty-container">
                <ElEmpty description=" ">
                    <h3>Select Wildcard</h3>
                </ElEmpty>
            </div>
        </ElCol>
    </ElRow>
</template>

<style scoped>
.wildcards-container {
    height: 65vh;
    margin-right: 5px;
    border-radius: 5px;
    border: var(--el-border);
}

.edit-buttons {
    position: absolute;
    right: 15px;
    top: 3px;
}

p {
    position: relative;
    margin: 0px; /* リストアイテム間の間隔 */
    margin-right: 10px; /* スクロールバー分を空ける */
    padding: 10px; /* 内側の余白 */
    border-radius: 5px; /* 角の丸み */
    transition: background-color 0.2s; /* スムーズな背景色の変更 */
    font-size: 14px;
}

p:hover {
    background-color: var(--el-color-info-light-7);
}

.wildcard-selected,
p.wildcard-selected:hover {
    background-color: var(--el-color-primary-light-5);
}

.wildcard-renaming {
    padding: 2px;
}

.dark-button-success {
    --el-button-bg-color: var(--el-color-success-light-3);
    --el-button-border-color: var(--el-color-success-light-5);
    --el-button-hover-bg-color: var(--el-color-success-light-7);
    --el-button-hover-border-color: var(--el-color-success-light-8);
}

.empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
}
</style>
