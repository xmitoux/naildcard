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
    <ElRow style="margin: 10px 0" :gutter="75">
        <ElCol :span="11" />
        <ElCol style="height: 24px" :span="13">
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
        </ElCol>
    </ElRow>

    <ElRow :gutter="65">
        <ElCol :span="9">
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
                <ElImage alt="Preview Image" fit="contain" :src="imageUrl" w-full />
                <ElButton
                    class="image-close-button"
                    circle
                    :icon="Close"
                    type="info"
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
        <ElCol v-show="fileList.length" :span="15">
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
    height: 69vh;
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
    height: 65vh;
}

.image-container {
    position: relative;
    cursor: pointer;
}

.image-close-button {
    position: absolute;
    top: 5px;
    right: 5px;
}
.text-container {
    height: 67vh;
    padding: 7px 10px;
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
}

.dark-button-warning {
    --el-button-bg-color: var(--el-color-warning-light-3);
    --el-button-border-color: var(--el-color-warning-light-5);
    --el-button-hover-bg-color: var(--el-color-warning-light-7);
    --el-button-hover-border-color: var(--el-color-warning-light-8);
}
</style>
