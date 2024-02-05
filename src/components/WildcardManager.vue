<script setup lang="ts">
import { ref, watchEffect, computed, nextTick, watch } from 'vue';
import { Check, Checked, Close, DeleteFilled, EditPen, List } from '@element-plus/icons-vue';
import {
    ElButton,
    ElButtonGroup,
    ElCol,
    ElInput,
    ElMessage,
    ElPopconfirm,
    ElRow,
    ElScrollbar,
} from 'element-plus';
import PromptTextarea from '@/components/PromptTextarea.vue';
import { useClipboardCopy } from '@/composables/useClipboardCopy';
import { insertDanbooruTagToTextarea, parseWildcardsString } from '@/utils/utils';

const props = defineProps<{
    wildcardsStringProp: string;
}>();

const emit = defineEmits<{
    change: [changedWildcardsString: string];
}>();

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

const wildcardsString = ref('');

// 起動時の設定読み込みを監視
watchEffect(() => {
    wildcardsString.value = props.wildcardsStringProp;
});

const wildcardsObj = computed<WildcardMap>(() => parseWildcardsString(wildcardsString.value));

const selectWildcard = (wildcardKey: string) => {
    selectedWildcard.value = wildcardKey;

    if (selectedWildcard.value !== renamingWildcard.value) {
        // リネーム中に他の行を選択した場合は終了
        cancelRenamingWildcard();
    }
};

const selectedWildcardString = computed<string>(() => {
    if (!selectedWildcard.value) {
        return '';
    }
    return wildcardsObj.value[selectedWildcard.value]?.join('\n') || '';
});

const isWildcardSelected = (wildcardKey: string) => wildcardKey === selectedWildcard.value;

const wildcardTextareaRef = ref<PromptTextareaRef>(null);
const newWildcardKey = ref<string>('');

const newWildcardKeyTrim = computed(() => newWildcardKey.value.trim());
const addNewWildcard = () => {
    if (addWildcard(newWildcardKeyTrim.value)) {
        newWildcardKey.value = '';
        saveWildcard();
        nextTick(() => wildcardTextareaRef.value?.textareaRef.textarea.focus());
    }
};

const addWildcard = (addingWildcardKey: string): boolean => {
    if (!validateWildcardName(addingWildcardKey)) {
        return false;
    }

    wildcardsObj.value[addingWildcardKey] = [];
    selectedWildcard.value = addingWildcardKey;

    return true;
};

const invalidWildcardNameChars = ['(', ')', '<', '>', '$', '#', '__', ':'];
const validateWildcardName = (name: string): boolean => {
    if (!name) {
        return false;
    }

    if (invalidWildcardNameChars.some((invalidChar) => name.includes(invalidChar))) {
        ElMessage.warning('Wildcard includes invalid chars!');
        return false;
    }

    if (Object.keys(wildcardsObj.value).includes(name)) {
        ElMessage.warning('Wildcard already exists!');
        return false;
    }

    return true;
};

const deleteWildcard = (wildcardKey: string) => {
    delete wildcardsObj.value[wildcardKey];
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

    if (wildcardStrings.some((str) => str.endsWith(':'))) {
        ElMessage.error("Variants ending with ':' are not allowed! Changes will not be saved!");
        return;
    }

    wildcardsObj.value[selectedWildcard.value] = wildcardStrings;
    saveWildcard();
};

const saveWildcard = () => {
    const parseWildcardsObject = (obj: WildcardMap): string => {
        let result = '';

        // キーを昇順でソート
        const sortedKeys = Object.keys(obj).sort();

        for (const key of sortedKeys) {
            // キーを追加
            result += `${key}:\n`;

            // 配列の各値を追加
            for (const value of obj[key]) {
                result += `${value}\n`;
            }
        }

        return result.replace(/\n$/, '');
    };

    wildcardsString.value = parseWildcardsObject(wildcardsObj.value);
    emit('change', wildcardsString.value);
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

const saveRenamingWildcard = () => {
    if (renamedWildcard.value === renamingWildcard.value) {
        cancelRenamingWildcard();
        return;
    }

    if (addWildcard(renamedWildcard.value)) {
        wildcardsObj.value[renamedWildcard.value] = wildcardsObj.value[renamingWildcard.value];
        delete wildcardsObj.value[renamingWildcard.value];
        saveWildcard();

        // リネーム後を選択状態にするために保持
        const renamedWildcardName = renamedWildcard.value;

        cancelRenamingWildcard();

        selectWildcard(renamedWildcardName);
    }
};

const cancelRenamingWildcard = () => {
    renamingWildcard.value = '';
    renamedWildcard.value = '';
    renameWildcardInputRef.value = null;
};

const sortedWildcard = computed<string[]>(() => Object.keys(wildcardsObj.value).sort());

const onRenameInputFocus = () => {
    const input = renameWildcardInputRef.value![0].input!;
    input.selectionStart = 0;
    input.selectionEnd = renamingWildcard.value.length;
};

const { copying, copyToClipboard } = useClipboardCopy();
</script>

<template>
    <!-- 追加エリア -->
    <ElRow>
        <ElCol :span="9">
            <ElInput
                v-model="newWildcardKey"
                clearable
                placeholder="New Wildcard"
                @keydown.prevent.enter="addNewWildcard"
            >
                <template #append>
                    <ElButton :disabled="!newWildcardKeyTrim" @click="addNewWildcard">Add</ElButton>
                </template>
            </ElInput>
        </ElCol>
    </ElRow>

    <ElRow>
        <!-- 選択エリア -->
        <ElCol :span="9">
            <ElScrollbar :max-height="325">
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
        </ElCol>

        <!-- 編集エリア -->
        <ElCol :span="15">
            <PromptTextarea
                v-show="selectedWildcard"
                ref="wildcardTextareaRef"
                :rows="15"
                :prompt-text-prop="selectedWildcardString"
                @change="editWildcardString"
            />
        </ElCol>
    </ElRow>
</template>

<style scoped>
.edit-buttons {
    position: absolute;
    right: 15px;
    top: 2px;
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
    background-color: var(--el-color-info);
}

.wildcard-selected,
p.wildcard-selected:hover {
    background-color: var(--el-color-primary-light-3);
}

.wildcard-renaming {
    padding: 2px;
}
</style>
