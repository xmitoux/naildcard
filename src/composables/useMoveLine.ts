export const useMoveLine = (promptText: Ref<string>) => {
    const moveLine = (event: KeyboardEvent) => {
        if (
            !(
                (event.ctrlKey || event.metaKey) &&
                event.altKey &&
                (event.key === 'ArrowUp' || event.key === 'ArrowDown')
            )
        ) {
            return;
        }

        event.preventDefault();

        const targetTextarea = event.target as HTMLTextAreaElement;
        const lines = targetTextarea.value.split('\n');
        let { selectionStart, selectionEnd } = targetTextarea;

        // Find the range of selected lines with improved logic
        let startLine = 0;
        let endLine = 0;
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            // Adjust the counting to properly handle the cursor at the beginning of a line
            const lineEnd = charCount + lines[i].length;
            if (charCount <= selectionStart && selectionStart <= lineEnd) {
                startLine = i;
            }
            if (charCount <= selectionEnd && selectionEnd <= lineEnd) {
                endLine = i;
            }
            charCount += lines[i].length + 1; // +1 for the newline character
        }

        // Calculate new positions and swap lines
        if (event.key === 'ArrowUp' && startLine > 0) {
            const lineAbove = lines[startLine - 1];
            lines.splice(
                startLine - 1,
                endLine - startLine + 2,
                ...lines.slice(startLine, endLine + 1),
                lineAbove,
            );
            selectionStart -= lineAbove.length + 1;
            selectionEnd -= lineAbove.length + 1;
        } else if (event.key === 'ArrowDown' && endLine < lines.length - 1) {
            const lineBelow = lines[endLine + 1];
            lines.splice(
                startLine,
                endLine - startLine + 2,
                lineBelow,
                ...lines.slice(startLine, endLine + 1),
            );
            selectionStart += lineBelow.length + 1;
            selectionEnd += lineBelow.length + 1;
        }

        promptText.value = lines.join('\n');

        nextTick(() => {
            targetTextarea.setSelectionRange(selectionStart, selectionEnd);
        });
    };

    return {
        moveLine,
    };
};
