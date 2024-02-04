import { Ref, nextTick } from 'vue';

export const useToggleComment = (promptText: Ref<string>) => {
    const toggleComment = (event: KeyboardEvent) => {
        if ((!event.ctrlKey && !event.metaKey) || event.key !== '/') {
            return;
        }

        event.preventDefault();

        const text = promptText.value;
        const targetTextarea = event.target as HTMLTextAreaElement;

        const selectionStart = targetTextarea.selectionStart;
        const selectionEnd = targetTextarea.selectionEnd;
        const selectedText = text.substring(selectionStart, selectionEnd);

        // 複数行が選択されているか判断
        if (selectedText.includes('\n')) {
            // 複数行の処理
            const startOfLine = text.lastIndexOf('\n', selectionStart - 1) + 1; // 選択開始行の行頭を見つける
            const endOfLine =
                text.indexOf('\n', selectionEnd - 1) !== -1
                    ? text.indexOf('\n', selectionEnd - 1)
                    : text.length; // 選択終了行の行末を見つける

            const linesText = text.substring(startOfLine, endOfLine); // 選択された全行のテキスト
            const lines = linesText.split('\n');
            const allLinesAreCommented = lines.every((line) => line.trim().startsWith('#'));

            const modifyLines = lines.map((line) => {
                if (allLinesAreCommented) {
                    // すべての行がコメント済みの場合は、コメントを解除
                    return line.trim().startsWith('#') ? line.replace('#', '') : line;
                } else {
                    // そうでなければ、コメントを追加
                    return `#${line}`;
                }
            });

            const commentedText = modifyLines.join('\n');
            promptText.value = text.slice(0, startOfLine) + commentedText + text.slice(endOfLine);

            // テキスト更新後に選択範囲を復元
            nextTick(() =>
                targetTextarea.setSelectionRange(startOfLine, startOfLine + commentedText.length),
            );
        } else {
            // 部分コメント処理
            if (selectionStart !== selectionEnd) {
                const commentWord = () => {
                    let commentedText: string;

                    if (selectedText.startsWith('#') && selectedText.endsWith('#')) {
                        commentedText = selectedText.slice(1, -1);
                    } else {
                        commentedText = `#${selectedText}#`;
                    }

                    promptText.value =
                        text.slice(0, selectionStart) + commentedText + text.slice(selectionEnd);

                    // 更新したテキスト内で選択範囲を復元
                    nextTick(() =>
                        targetTextarea.setSelectionRange(
                            selectionStart,
                            selectionStart + commentedText.length,
                        ),
                    );
                };

                commentWord();
                return;
            }

            // 行コメント処理
            const commentLine = () => {
                let caretPos = targetTextarea.selectionStart;

                const beforeCaretText = text.substring(0, caretPos);
                const lineStart = beforeCaretText.lastIndexOf('\n') + 1;
                const lineEnd =
                    text.indexOf('\n', caretPos) !== -1
                        ? text.indexOf('\n', caretPos)
                        : text.length;

                const lineText = text.substring(lineStart, lineEnd);
                let newText;

                // Toggle comment
                if (lineText.trim().startsWith('#')) {
                    // Uncomment
                    newText =
                        text.substring(0, lineStart) +
                        lineText.replace('#', '') +
                        text.substring(lineEnd);
                    // Adjust caret position due to character removal
                    caretPos -= 1;
                } else {
                    // Comment out
                    newText =
                        text.substring(0, lineStart) + '#' + lineText + text.substring(lineEnd);
                    // Adjust caret position due to character addition
                    caretPos += 1;
                }

                promptText.value = newText;

                // Restore caret position to the beginning of the line or after the toggled comment
                nextTick(
                    () => (targetTextarea.selectionStart = targetTextarea.selectionEnd = caretPos),
                );
            };

            commentLine();
        }
    };

    return { toggleComment };
};
