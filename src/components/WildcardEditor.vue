<script setup lang="ts">
import { ACTION_UPDATE_SETTINGS } from '@/constants/chrome';
import { NAI_URL } from '@/constants/nai';
import { parseWildcardsString } from '@/utils/utils';
import { ElMessage, ElMessageBox } from 'element-plus';

const wildcardsString = ref<string>('');
const wildcards = ref<Record<string, string[]>>({});

const newWildcardKey = ref<string>('');
const selectedWildcardKey = ref<string | null>(null);
const wildcardTextareaRef = ref<{ textareaRef: { textarea: HTMLTextAreaElement } } | null>(null);

onMounted(async () => {
    const storageSettings = await chrome.storage.sync.get();
    wildcardsString.value = storageSettings.wildcards || '';
    wildcards.value = parseWildcardsString(wildcardsString.value);
});

const currentWildcardText = computed<string>(() => {
    if (!selectedWildcardKey.value) {
        return '';
    }
    return wildcards.value[selectedWildcardKey.value]?.join('\n') || '';
});

const isWildcardManagerMode = ref(true);
const toggleEditMode = () => {
    if (isWildcardManagerMode.value) {
        wildcards.value = parseWildcardsString(wildcardsString.value);
    } else {
        wildcardsString.value = parseWildcardObject(wildcards.value);
    }
};

const sortedWildcardKeys = computed<string[]>(() => Object.keys(wildcards.value).sort());

const addNewWildcardKey = () => {
    if (addWildcardKey(newWildcardKey.value)) {
        newWildcardKey.value = '';
        nextTick(() => wildcardTextareaRef.value?.textareaRef.textarea.focus());
    }
};

const addWildcardKey = (addingWildcardKey: string): boolean => {
    if (!addingWildcardKey) {
        return false;
    }

    if (Object.keys(wildcards.value).includes(addingWildcardKey)) {
        ElMessage.warning('Wildcard already exists!');
        return false;
    }

    wildcards.value[addingWildcardKey] = [];
    selectedWildcardKey.value = addingWildcardKey;

    return true;
};

const wildcardKeyStyle = (wildcardKey: string) =>
    wildcardKey === selectedWildcardKey.value ? { 'background-color': 'lightblue' } : {};

const saveInSimpleMode = (changedWildcardsString: string) => {
    wildcardsString.value = changedWildcardsString;
    saveWildcard();
};

const parseWildcardObject = (obj: Record<string, string[]>): string => {
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

        // キーごとに改行を追加
        result += '\n';
    }

    return result.trim(); // 末尾の余分な改行を削除
};

const saveWildcard = async () => {
    await chrome.storage.sync.set({ wildcards: wildcardsString.value });

    const [tab] = await chrome.tabs.query({ url: NAI_URL });
    if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: ACTION_UPDATE_SETTINGS });
    }
};

const changeSelectedWildcardText = (changedWildcardString: string) => {
    wildcards.value[selectedWildcardKey.value!] = changedWildcardString.split('\n');
    saveInPaneMode();
};

const saveInPaneMode = () => {
    wildcardsString.value = parseWildcardObject(wildcards.value);
    saveWildcard();
};

const hoveredWildcardKey = ref('');
const isWildcardkeyHovered = (wildcardKey: string) => {
    return wildcardKey === hoveredWildcardKey.value;
};

const showWildcardKeyEditButton = (wildcardKey: string) => {
    hoveredWildcardKey.value = wildcardKey;
};

const hideWildcardKeyEditButton = () => {
    hoveredWildcardKey.value = '';
};

const editingWildcardKey = ref('');
const isWildcardKeyEditing = (wildcardKey: string) => {
    return wildcardKey === editingWildcardKey.value;
};

const editedWildcardKey = ref('');
const startEditingWildcardKey = (wildcardKey: string) => {
    editingWildcardKey.value = wildcardKey;
    editedWildcardKey.value = wildcardKey;
};

const deleteWildcardKey = (wildcardKey: string) => {
    ElMessageBox.confirm(`Delete wildcard "${selectedWildcardKey.value}". Confirm?`, 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
    }).then(() => {
        delete wildcards.value[wildcardKey];
        saveInPaneMode();
    });
};

const saveEditingWildcardKey = () => {
    if (editedWildcardKey.value === editingWildcardKey.value) {
        cancelEditingWildcardKey();
        return;
    }

    if (addWildcardKey(editedWildcardKey.value)) {
        wildcards.value[editedWildcardKey.value] = wildcards.value[editingWildcardKey.value];
        delete wildcards.value[editingWildcardKey.value];
        saveInPaneMode();
        cancelEditingWildcardKey();
    }
};

const cancelEditingWildcardKey = () => {
    editingWildcardKey.value = '';
    editedWildcardKey.value = '';
    editWildcardKeyInputRef.value = null;
};

const selectWildcardKey = (wildcardKey: string) => {
    selectedWildcardKey.value = wildcardKey;

    if (selectedWildcardKey.value !== editingWildcardKey.value) {
        // リネーム中に他の行を選択した場合は終了
        cancelEditingWildcardKey();
    }
};

const editWildcardKeyInputRef = ref<HTMLInputElement[] | null>(null);
watch(editWildcardKeyInputRef, () => {
    // リネーム時のオートフォーカス
    editWildcardKeyInputRef.value?.[0].focus();
});
</script>

<template>
    <div style="height: 500px">
        <el-switch
            v-model="isWildcardManagerMode"
            inactive-text="Wildcard Simple Editor"
            active-text="Wildcard Manager"
            @change="toggleEditMode"
        />

        <template v-if="isWildcardManagerMode">
            <el-row :gutter="10">
                <el-col :span="6">
                    <el-input
                        v-model="newWildcardKey"
                        clearable
                        placeholder="New wildcard"
                        @keydown.prevent.enter="addNewWildcardKey"
                    />
                </el-col>
                <el-col :span="6">
                    <el-button type="primary" @click="addNewWildcardKey">Add</el-button>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="8">
                    <ul>
                        <li
                            v-for="wildcardKey in sortedWildcardKeys"
                            :key="wildcardKey"
                            :style="wildcardKeyStyle(wildcardKey)"
                            @click="selectWildcardKey(wildcardKey)"
                            @dblclick="startEditingWildcardKey(wildcardKey)"
                            @mouseover="showWildcardKeyEditButton(wildcardKey)"
                            @mouseleave="hideWildcardKeyEditButton"
                        >
                            <el-input
                                v-if="isWildcardKeyEditing(wildcardKey)"
                                v-model="editedWildcardKey"
                                @keydown.prevent.enter="saveEditingWildcardKey"
                                @keydown.prevent.esc="cancelEditingWildcardKey"
                                ref="editWildcardKeyInputRef"
                            />
                            <span v-else>
                                {{ wildcardKey }}
                            </span>

                            <span class="buttons">
                                <template v-if="isWildcardKeyEditing(wildcardKey)">
                                    <el-button
                                        type="success"
                                        circle
                                        @click.stop="saveEditingWildcardKey"
                                    >
                                        <el-icon><Check /></el-icon>
                                    </el-button>
                                    <el-button
                                        type="info"
                                        circle
                                        @click.stop="cancelEditingWildcardKey"
                                    >
                                        <el-icon><Close /></el-icon>
                                    </el-button>
                                </template>

                                <template
                                    v-else-if="
                                        !editingWildcardKey && isWildcardkeyHovered(wildcardKey)
                                    "
                                >
                                    <el-button
                                        type="info"
                                        circle
                                        @click="startEditingWildcardKey(wildcardKey)"
                                    >
                                        <el-icon><EditPen /></el-icon>
                                    </el-button>
                                    <el-button
                                        type="danger"
                                        circle
                                        @click="deleteWildcardKey(wildcardKey)"
                                    >
                                        <el-icon><DeleteFilled /></el-icon>
                                    </el-button>
                                </template>
                            </span>
                        </li>
                    </ul>
                </el-col>

                <el-col :span="16">
                    <PromptTextarea
                        v-show="selectedWildcardKey"
                        ref="wildcardTextareaRef"
                        :prompt-text-prop="currentWildcardText"
                        @change="changeSelectedWildcardText"
                    />
                </el-col>
            </el-row>
        </template>

        <template v-else>
            <PromptTextarea :prompt-text-prop="wildcardsString" @change="saveInSimpleMode" />
        </template>
    </div>
</template>

<style>
.buttons {
    position: absolute;
    right: 5px;
    top: 3px;
}

ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    height: 500px;
}

ul li {
    position: relative;
    margin-bottom: 0px; /* リストアイテム間の間隔 */
    padding: 10px; /* 内側の余白 */
    border-radius: 5px; /* 角の丸み */
    transition: background-color 0.2s; /* スムーズな背景色の変更 */
    font-size: 14px;
}

ul li:hover {
    background-color: #e0e0e0; /* ホバー時の背景色 */
}
</style>
