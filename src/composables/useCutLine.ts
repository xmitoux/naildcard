import { Ref, nextTick } from 'vue';

export const useCutLine = (promptText: Ref<string>) => {
    const cutLine = (event: KeyboardEvent) => {
        if ((!event.ctrlKey && !event.metaKey) || event.key !== 'x') {
            return;
        }

        const targetTextarea = event.target as HTMLTextAreaElement;

        const selectionStart = targetTextarea.selectionStart;
        const selectionEnd = targetTextarea.selectionEnd;

        if (selectionStart === selectionEnd) {
            // 文字が選択されていない場合に行カットを実行
            event.preventDefault();

            const text = promptText.value;
            // キャレット行の開始位置(先頭行が空のときは正しくカットできないので0固定)
            const startOfLine =
                selectionStart === 0 ? 0 : text.lastIndexOf('\n', selectionStart - 1) + 1;
            const endOfLine = text.indexOf('\n', selectionStart);
            const lineText = text.substring(
                startOfLine,
                endOfLine !== -1 ? endOfLine : text.length,
            );

            // 空行はコピーしない
            lineText.trim() && navigator.clipboard.writeText(lineText + '\n');

            // テキストエリアから該当行とその改行を削除
            let newText;
            if (startOfLine > 0) {
                // 行の削除に先立って、行の開始がテキストの先頭でない場合は、直前の改行も削除
                newText =
                    text.slice(0, startOfLine - 1) +
                    text.slice(endOfLine !== -1 ? endOfLine : text.length);
            } else {
                // 行がテキストの先頭の場合は、次の改行のみ削除
                newText = text.slice(endOfLine !== -1 ? endOfLine + 1 : text.length);
            }
            promptText.value = newText;

            // キャレット位置を更新（行を削除したので、前の行の終わりまたはテキストの先頭に移動）
            const newCaretPosition = startOfLine > 0 ? startOfLine : 0;
            nextTick(() => {
                targetTextarea.selectionStart = targetTextarea.selectionEnd = newCaretPosition;
            });
        }
    };

    return {
        cutLine,
    };
};
