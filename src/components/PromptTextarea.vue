<script setup lang="ts">
import { useControlBracket } from '@/composables/useControlBracket';
import { useInputHistory } from '@/composables/useInputHistory';
import { useToggleComment } from '@/composables/useToggleComment';

const props = defineProps<{
    promptTextProp: string;
}>();

const promptText = ref('');
const textareaRef = ref<{ textarea: HTMLTextAreaElement } | null>(null);

// 親コンポーネントからtextareaのrefを参照できるように公開
defineExpose({ textareaRef });

// 起動時の設定読み込みを監視
watchEffect(() => (promptText.value = props.promptTextProp));

const emit = defineEmits<{
    change: [changedPrompt: string];
}>();

const { inputHistory } = useInputHistory(promptText);
const { controlBracket, autoBracket } = useControlBracket(promptText);
const { toggleComment } = useToggleComment(promptText);

const handleKeydown = (event: KeyboardEvent) => {
    inputHistory(event);
    controlBracket(event);
    toggleComment(event);
};

watch(promptText, () => emit('change', promptText.value));
</script>

<template>
    <el-input
        v-model="promptText"
        ref="textareaRef"
        type="textarea"
        :autosize="{ minRows: 10 }"
        @change="emit('change', promptText)"
        @keydown="handleKeydown($event)"
        @beforeinput="autoBracket"
    />
</template>
