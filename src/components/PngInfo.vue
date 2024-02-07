<script setup lang="ts">
import { ref } from 'vue';
import { getMetadata } from 'meta-png';
import {
    ElButton,
    ElCol,
    ElIcon,
    ElImage,
    ElRow,
    ElTabPane,
    ElTabs,
    ElUpload,
    UploadRequestHandler,
    UploadRequestOptions,
    UploadUserFile,
} from 'element-plus';
import { Checked, Close, List, PictureFilled } from '@element-plus/icons-vue';
import { useDark } from '@vueuse/core';
import { useClipboardCopy } from '@/composables/useClipboardCopy';

const isDark = useDark();

type PngMetaData = {
    prompt: string;
    uc: string;
    height: number;
    width: number;
    seed: number;

    request_type: string;
    steps: number;
    sampler: string;
    scale: number;
    strength?: number;
    noise?: number;
};

const fileList = ref<UploadUserFile[]>([]);

const imageUrl = ref('');
const pngMetaData = ref<PngMetaData>();
const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target!.result as ArrayBuffer;
        try {
            const uint8Array = new Uint8Array(buffer);
            const metadata = getMetadata(uint8Array, 'Comment') as string;
            pngMetaData.value = JSON.parse(metadata);
            // console.log(pngMetaData.value);
            imageUrl.value = URL.createObjectURL(file);
        } catch (error) {
            console.error('Error reading metadata: ', error);
        }
    };
    reader.readAsArrayBuffer(file);
};

const handleUploadImage: UploadRequestHandler = async (options: UploadRequestOptions) => {
    const file = options.file;
    loadImage(file);
};

const fileInput = ref<HTMLInputElement | null>(null);
const openImagePicker = () => {
    fileInput.value?.click();
};

const handleImageChange = (event: Event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files[0]) {
        loadImage(files[0]);
    }
};

const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
};

const handleDropImage = (event: DragEvent) => {
    event.preventDefault();

    if (event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0];

        if (file.type.startsWith('image/')) {
            loadImage(file);
        }
    }
};

type InfoTabName = 'Positive' | 'Negative' | 'Other Info';
const activeTabName = ref<InfoTabName>('Positive');

const { copying, copyToClipboard } = useClipboardCopy();
const copyPrompt = () => {
    copyToClipboard(
        activeTabName.value === 'Positive' ? pngMetaData.value!.prompt! : pngMetaData.value!.uc!,
    );
};
</script>

<template>
    <ElRow style="margin: 10px 0">
        <ElCol style="height: 24px" :span="7">
            <!-- スペース -->
        </ElCol>
        <ElButton
            v-show="fileList.length && activeTabName !== 'Other Info'"
            :class="{ 'dark-button-warning': isDark, 'copy-button': true }"
            :icon="copying ? Checked : List"
            size="small"
            type="warning"
            @click="copyPrompt"
        >
            Copy {{ activeTabName }} Prompt
        </ElButton>
    </ElRow>

    <ElRow>
        <ElCol :span="7">
            <!-- 画像アップロードエリア -->
            <ElUpload
                v-show="!fileList.length"
                v-model:file-list="fileList"
                accept=".png"
                drag
                :http-request="handleUploadImage"
                :show-file-list="false"
            >
                <div class="el-upload-container">
                    <ElIcon class="el-icon--upload"><PictureFilled /></ElIcon>
                    <div class="el-upload__text">Drop png image file here or click to upload</div>
                </div>
            </ElUpload>

            <!-- 画像表示エリア -->
            <div
                v-show="fileList.length"
                class="image-container"
                @click="openImagePicker"
                @dragover="handleDragOver"
                @drop="handleDropImage"
            >
                <ElImage alt="Preview Image" fit="contain" :src="imageUrl" />
                <ElButton
                    class="image-close-button"
                    circle
                    :icon="Close"
                    type="info"
                    size="small"
                    @click.stop="fileList = []"
                />
                <!-- 画像表示時のアップロードinput -->
                <input
                    style="display: none"
                    ref="fileInput"
                    accept=".png"
                    type="file"
                    @change="handleImageChange"
                />
            </div>
        </ElCol>

        <!-- PNG Info エリア -->
        <ElCol v-show="fileList.length" :span="17">
            <ElTabs v-model="activeTabName" tab-position="left">
                <ElTabPane label="Positive" name="Positive">
                    <div class="text-container">
                        {{ pngMetaData?.prompt }}
                    </div>
                </ElTabPane>
                <ElTabPane label="Negative" name="Negative">
                    <div class="text-container">
                        {{ pngMetaData?.uc }}
                    </div>
                </ElTabPane>
                <ElTabPane label="Other Info" name="Other Info">
                    <div class="text-container"></div>
                </ElTabPane>
            </ElTabs>
        </ElCol>
    </ElRow>
</template>

<style scoped>
:deep(.el-upload-dragger) {
    width: 45vh;
    height: 65vh;
    padding: 0;
}

:deep(.el-upload__text) {
    user-select: none;
}

.el-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
}

.image-container {
    width: 45vh;
    height: 65vh;
    padding: 5px;
    display: flex;
    justify-content: center;
    text-align: center;
    position: relative;
    cursor: pointer;
    border-radius: 5px;
    border: var(--el-border);
}

.image-close-button {
    position: absolute;
    top: 10px;
    right: 10px;
}
.text-container {
    height: 65vh;
    padding: 5px 10px;
    border-radius: 5px;
    border: var(--el-border);
    font-size: 14px;
    line-height: 1.3;
    word-wrap: break-word;
    white-space: pre-wrap;
    overflow-y: auto;
}

.copy-button {
    width: 160px;
    height: 24px;
    margin-left: 115px;
}

.dark-button-warning {
    --el-button-bg-color: var(--el-color-warning-light-3);
    --el-button-border-color: var(--el-color-warning-light-5);
    --el-button-hover-bg-color: var(--el-color-warning-light-7);
    --el-button-hover-border-color: var(--el-color-warning-light-8);
}
</style>
