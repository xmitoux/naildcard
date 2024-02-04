import { Ref } from 'vue/dist/vue.js';

export const useCopyLine = (promptText: Ref<string>) => {
    const copyLine = (event: KeyboardEvent) => {
        if ((!event.ctrlKey && !event.metaKey) || event.key !== 'c') {
            return;
        }

        const targetTextarea = event.target as HTMLTextAreaElement;

        const selectionStart = targetTextarea.selectionStart;
        const selectionEnd = targetTextarea.selectionEnd;

        if (selectionStart === selectionEnd) {
            // 文字が選択されていない場合に行コピーを実行
            event.preventDefault();

            const text = promptText.value;
            const startOfLine = text.lastIndexOf('\n', selectionStart - 1) + 1;
            const endOfLine = text.indexOf('\n', selectionStart);
            const lineText = text.substring(
                startOfLine,
                endOfLine !== -1 ? endOfLine : text.length,
            );

            navigator.clipboard.writeText(lineText + '\n');
        }
    };

    return {
        copyLine,
    };
};
