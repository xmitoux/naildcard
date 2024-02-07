<script setup lang="ts">
import { computed, ref } from 'vue';
import { getMetadata } from 'meta-png';
import {
    ElButton,
    ElCol,
    ElEmpty,
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
    width: number;
    height: number;
    steps: number;
    scale: number;
    seed: number;
    sampler: string;
    sm: boolean;
    sm_dyn: boolean;
    request_type: string;
    strength?: number;
    noise?: number;
    uncond_scale: number;
    cfg_rescale: number;
    noise_schedule: string;
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
            if (metadata) {
                pngMetaData.value = JSON.parse(metadata);
            } else {
                pngMetaData.value = undefined;
            }
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

const pngOtherInfo = computed<string>(() => {
    const metaData = pngMetaData.value;
    if (!metaData) {
        return '';
    }
    type RequestType = 'text2image' | 'image2image' | 'inpaint';
    const requestTypeMap: Record<string, RequestType> = {
        PromptGenerateRequest: 'text2image',
        Img2ImgRequest: 'image2image',
        NativeInfillingRequest: 'inpaint',
    };

    const requestType = requestTypeMap[metaData.request_type];

    const i2iParams =
        requestType === 'image2image'
            ? `
Strength: ${metaData.strength}

Noise: ${metaData.noise}
`
            : '';

    const smea =
        requestType === 'text2image'
            ? `
SMEA: ${metaData.sm ? 'ON' : 'OFF'}

DYN: ${metaData.sm_dyn ? 'ON' : 'OFF'}
`
            : '';

    const otherInfoString = `Width: ${metaData.width}
    
Height: ${metaData.height}

Steps: ${metaData.steps}

Guidance Scale: ${metaData.scale}

Seed: ${metaData.seed}

Sampler: ${metaData.sampler}

Generation Type: ${requestType}
${i2iParams}${smea}
Undesired Content Strength: ${metaData.uncond_scale}

Prompt Guidance Rescale : ${metaData.cfg_rescale}

Noise Schedule: ${metaData.noise_schedule}
`;

    return otherInfoString;
});
</script>

<template>
    <ElRow style="margin: 10px 0">
        <ElCol style="height: 24px; margin-right: 115px" :span="7">
            <!-- スペース -->
        </ElCol>
        <ElButton
            v-show="fileList.length && pngMetaData && activeTabName !== 'Other Info'"
            :class="{ 'dark-button-warning': isDark }"
            :icon="copying ? Checked : List"
            size="small"
            type="warning"
            @click="copyPrompt"
        >
            Copy {{ activeTabName }}
        </ElButton>
    </ElRow>

    <ElRow>
        <ElCol v-if="!fileList.length" :span="24">
            <!-- 画像アップロードエリア -->
            <ElUpload
                v-model:file-list="fileList"
                accept=".png"
                drag
                :http-request="handleUploadImage"
                :show-file-list="false"
            >
                <div class="el-upload-container">
                    <ElIcon class="el-icon--upload"><PictureFilled /></ElIcon>
                    <h3>Drop NAI image file here or click to upload</h3>
                </div>
            </ElUpload>
        </ElCol>

        <template v-else>
            <ElCol :span="7">
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
                <ElTabs v-if="pngMetaData" v-model="activeTabName" tab-position="left">
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
                        <div class="text-container">{{ pngOtherInfo }}</div>
                    </ElTabPane>
                </ElTabs>
                <div v-else class="empty-container">
                    <ElEmpty description=" ">
                        <h3>No Info</h3>
                    </ElEmpty>
                </div>
            </ElCol>
        </template>
    </ElRow>
</template>

<style scoped>
:deep(.el-upload-dragger) {
    height: 65vh;
    padding: 0;
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

.dark-button-warning {
    --el-button-bg-color: var(--el-color-warning-light-3);
    --el-button-border-color: var(--el-color-warning-light-5);
    --el-button-hover-bg-color: var(--el-color-warning-light-7);
    --el-button-hover-border-color: var(--el-color-warning-light-8);
}

.empty-container {
    height: 60vh;
    display: flex;
    justify-content: center;
    text-align: center;
}
</style>
