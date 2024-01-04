<script setup lang="ts">
import { DeleteFilled, EditPen } from '@element-plus/icons-vue';
import {
    ElButton,
    ElCol,
    ElIcon,
    ElInput,
    ElMessage,
    ElPopconfirm,
    ElRow,
    ElScrollbar,
} from 'element-plus';
import PromptTextarea from '@/components/PromptTextarea.vue';

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

const addNewWildcard = () => {
    if (addWildcard(newWildcardKey.value)) {
        newWildcardKey.value = '';
        saveWildcard();
        nextTick(() => wildcardTextareaRef.value?.textareaRef.textarea.focus());
    }
};

const addWildcard = (addingWildcardKey: string): boolean => {
    if (!addingWildcardKey) {
        return false;
    }

    if (Object.keys(wildcardsObj.value).includes(addingWildcardKey)) {
        ElMessage.warning('Wildcard already exists!');
        return false;
    }

    wildcardsObj.value[addingWildcardKey] = [];
    selectedWildcard.value = addingWildcardKey;

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
    if (selectedWildcard.value) {
        // ワイルドカード削除不具合対応
        // (削除後はselectedWildcardがないので更新しない)
        wildcardsObj.value[selectedWildcard.value] = changedWildcardString.split('\n');
        saveWildcard();
    }
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

const renameWildcardInputRef = ref<HTMLInputElement[] | null>(null);
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
        cancelRenamingWildcard();
    }
};

const cancelRenamingWildcard = () => {
    renamingWildcard.value = '';
    renamedWildcard.value = '';
    renameWildcardInputRef.value = null;
};

const sortedWildcard = computed<string[]>(() => Object.keys(wildcardsObj.value).sort());
</script>

<template>
    <!-- 追加エリア -->
    <ElRow>
        <ElCol :span="8">
            <ElInput
                v-model="newWildcardKey"
                clearable
                placeholder="New Wildcard"
                @keydown.prevent.enter="addNewWildcard"
            >
                <template #append>
                    <ElButton @click="addNewWildcard">Add</ElButton>
                </template>
            </ElInput>
        </ElCol>
    </ElRow>

    <ElRow>
        <!-- 選択エリア -->
        <ElCol :span="8">
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
                            <ElButton
                                type="primary"
                                circle
                                @click="startRenamingWildcard(wildcardKey)"
                            >
                                <ElIcon><EditPen /></ElIcon>
                            </ElButton>

                            <ElPopconfirm
                                title="Are you sure to delete?"
                                :width="200"
                                @confirm="deleteWildcard(wildcardKey)"
                            >
                                <template #reference>
                                    <ElButton type="danger" circle>
                                        <ElIcon><DeleteFilled /></ElIcon>
                                    </ElButton>
                                </template>
                            </ElPopconfirm>
                        </span>
                    </template>

                    <template v-else-if="isWildcardRenaming(wildcardKey)">
                        <span class="edit-buttons">
                            <ElButton type="success" circle @click.stop="saveRenamingWildcard">
                                <ElIcon><Check /></ElIcon>
                            </ElButton>
                            <ElButton type="info" circle @click.stop="cancelRenamingWildcard">
                                <ElIcon><Close /></ElIcon>
                            </ElButton>
                        </span>
                    </template>
                </p>
            </ElScrollbar>
        </ElCol>

        <!-- 編集エリア -->
        <ElCol :span="16">
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
    background-color: #e0e0e0; /* ホバー時の背景色 */
}

.wildcard-selected {
    background-color: lightblue;
}

.wildcard-selected,
p.wildcard-selected:hover {
    background-color: lightblue;
}

.wildcard-renaming {
    padding: 2px;
}
</style>
CommaPosition TagCommaPosition
