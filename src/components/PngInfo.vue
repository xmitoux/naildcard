<script setup lang="ts">
import { ref } from 'vue';
import { getMetadata } from 'meta-png';
import {
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
import { PictureFilled } from '@element-plus/icons-vue';

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
    <ElRow>
        <ElCol :span="8">
            <ElUpload
                v-show="!fileList.length"
                v-model:file-list="fileList"
                accept=".png"
                drag
                :http-request="loadPngImage"
            >
                <ElIcon class="el-icon--upload"><PictureFilled /></ElIcon>
                <div class="el-upload__text">Drop png image file here or click to upload</div>
            </ElUpload>
            <ElImage
                v-show="fileList.length"
                style="width: 50vh; height: 60vh"
                alt="Preview Image"
                fit="contain"
                :src="imageUrl"
                w-full
            />
        </ElCol>

        <ElCol :span="16">
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
.text-container {
    height: 60vh;
    padding: 20px;
    margin: 20px 0;
    border-radius: 5px;
    border: 1px solid #ccc;
    font-size: 14px;
    line-height: 1.3;
    word-wrap: break-word;
    white-space: pre-wrap;
    overflow-y: auto;
}
</style>
