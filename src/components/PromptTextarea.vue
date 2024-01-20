<script setup lang="ts">
import { ElInput } from 'element-plus';

const props = defineProps<{
    promptTextProp: string;
    rows: number;
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
        :rows="props.rows"
        @change="emit('change', promptText)"
        @keydown="handleKeydown"
        @keydown.ctrl.space.prevent="emit('intellisense')"
        @beforeinput="autoBracket"
    />
</template>
