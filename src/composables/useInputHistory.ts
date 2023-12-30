export const useInputHistory = (promptText: Ref<string>) => {
    const history = ref<string[]>([promptText.value]);
    const currentHistoryIndex = ref(0);

    // currentTextが変わったら履歴に追加
    watch(promptText, (newText) => {
        if (history.value.length === 0 || history.value[currentHistoryIndex.value] !== newText) {
            if (currentHistoryIndex.value < history.value.length - 1) {
                // 途中の履歴を参照中の場合は、それ以降の履歴を切り捨てる
                history.value = history.value.slice(0, currentHistoryIndex.value + 1);
            }
            history.value.push(newText);
            currentHistoryIndex.value++;
        }
    });

    const inputHistory = (event: KeyboardEvent) => {
        if (!event.ctrlKey && !event.metaKey) {
            return;
        }

        let historyIndex = 0;
        if (event.key === 'z' && currentHistoryIndex.value > 0) {
            // undo
            historyIndex = --currentHistoryIndex.value;
        } else if (event.key === 'y' && currentHistoryIndex.value < history.value.length - 1) {
            // redo
            historyIndex = ++currentHistoryIndex.value;
        } else {
            return;
        }

        event.preventDefault();

        const target = event.target as HTMLTextAreaElement;
        // 履歴入力をするとキャレットが末尾に移動してしまうので、元の位置を保持しておく
        const caretPosition = target.selectionStart;

        promptText.value = history.value[historyIndex];

        // キャレットも元の位置に移動
        nextTick(() => {
            target.selectionStart = caretPosition;
            target.selectionEnd = caretPosition;
        });
    };

    return { inputHistory };
};
