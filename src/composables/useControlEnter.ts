import { Ref, nextTick } from 'vue';

export const useControlEnter = (promptText: Ref<string>) => {
    const controlEnter = (event: KeyboardEvent) => {
        if (
            !(
                (event.ctrlKey || event.metaKey) &&
                (event.key === 'Enter' || (event.shiftKey && event.key === 'Enter'))
            )
        ) {
            return;
        }
        event.preventDefault();

        const targetTextarea = event.target as HTMLTextAreaElement;
        const { selectionStart, value } = targetTextarea;

        // キャレット位置を基に行の開始と終了を見つける
        const beforeCursor = value.substring(0, selectionStart);
        const afterCursor = value.substring(selectionStart);

        // 改行コードを基に行を分割
        const beforeLine = beforeCursor.lastIndexOf('\n') + 1;
        let afterLine = afterCursor.indexOf('\n');

        if (afterLine !== -1) {
            afterLine += beforeCursor.length; // afterLineのインデックスを全体に対するものに変換
        } else {
            afterLine = value.length;
        }

        let newValue = '';
        let newPosition = 0;

        if (event.shiftKey) {
            // Ctrl + Shift + Enter: 現在行の上に空行を挿入
            newValue = value.slice(0, beforeLine) + '\n' + value.slice(beforeLine);
            newPosition = beforeLine;
        } else {
            // Ctrl + Enter: 現在行を改行し、その下に空行を挿入
            newValue = value.slice(0, afterLine) + '\n' + value.slice(afterLine);
            newPosition = afterLine + 1;
        }

        promptText.value = newValue;

        nextTick(() => {
            // キャレットを新しい行に移動
            targetTextarea.selectionStart = newPosition;
            targetTextarea.selectionEnd = newPosition;
            targetTextarea.focus();
        });
    };

    return {
        controlEnter,
    };
};
