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
import { Close, PictureFilled } from '@element-plus/icons-vue';

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

const pngMetaData = ref<PngMetaData>();
const fileList = ref<UploadUserFile[]>([]);

const loadPngImage: UploadRequestHandler = async (options: UploadRequestOptions) => {
    const file = options.file;
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
const imageUrl = ref('');

const activeTabName = ref('Positive');
</script>

<template>
    <ElRow style="margin-top: 10px" :gutter="65">
        <ElCol :span="9">
            <ElUpload
                v-show="!fileList.length"
                v-model:file-list="fileList"
                accept=".png"
                drag
                :http-request="loadPngImage"
                :show-file-list="false"
            >
                <div
                    style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 65vh;
                    "
                >
                    <ElIcon class="el-icon--upload"><PictureFilled /></ElIcon>
                    <div class="el-upload__text">Drop png image file here or click to upload</div>
                </div>
            </ElUpload>
            <div v-show="fileList.length" style="position: relative">
                <ElImage alt="Preview Image" fit="contain" :src="imageUrl" w-full />
                <ElButton
                    style="position: absolute; top: 5px; right: 5px"
                    circle
                    :icon="Close"
                    type="info"
                    @click="fileList = []"
                />
            </div>
        </ElCol>

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
</style>
