<script setup lang="ts">
import { ref, watchEffect, watch } from 'vue';
import { ElInput } from 'element-plus';
import { useControlBracket } from '@/composables/useControlBracket';
import { useControlEnter } from '@/composables/useControlEnter';
import { useCopyLine } from '@/composables/useCopyLine';
import { useCutLine } from '@/composables/useCutLine';
import { useInputHistory } from '@/composables/useInputHistory';
import { useMoveLine } from '@/composables/useMoveLine';
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
    intellisense: [];
}>();

const { inputHistory } = useInputHistory(promptText);
const { controlBracket, autoBracket } = useControlBracket(promptText);
const { toggleComment } = useToggleComment(promptText);
const { copyLine } = useCopyLine(promptText);
const { cutLine } = useCutLine(promptText);
const { moveLine } = useMoveLine(promptText);
const { controlEnter } = useControlEnter(promptText);

const handleKeydown = (event: KeyboardEvent | Event) => {
    const keyboardEvent = event as KeyboardEvent;
    inputHistory(keyboardEvent);
    controlBracket(keyboardEvent);
    toggleComment(keyboardEvent);
    copyLine(keyboardEvent);
    cutLine(keyboardEvent);
    moveLine(keyboardEvent);
    controlEnter(keyboardEvent);
};

watch(promptText, () => emit('change', promptText.value));
</script>

<template>
    <ElInput
        v-model="promptText"
        ref="textareaRef"
        type="textarea"
        resize="none"
        @change="emit('change', promptText)"
        @keydown="handleKeydown"
        @keydown.ctrl.space.prevent="emit('intellisense')"
        @beforeinput="autoBracket"
    />
</template>

<style scoped>
:deep(.el-textarea__inner) {
    height: 65vh;
}
</style>
