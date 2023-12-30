export const useToggleComment = (promptText: Ref<string>) => {
    const toggleComment = (event: KeyboardEvent) => {
        if ((!event.ctrlKey && !event.metaKey) || event.key !== '/') {
            return;
        }

        event.preventDefault();

        const target = event.target as HTMLTextAreaElement;

        const { value: text } = target;
        let caretPos = target.selectionStart;

        const beforeCaretText = text.substring(0, caretPos);
        const lineStart = beforeCaretText.lastIndexOf('\n') + 1;
        const lineEnd =
            text.indexOf('\n', caretPos) !== -1 ? text.indexOf('\n', caretPos) : text.length;

        const lineText = text.substring(lineStart, lineEnd);
        let newText;

        // Toggle comment
        if (lineText.trim().startsWith('#')) {
            // Uncomment
            newText =
                text.substring(0, lineStart) + lineText.replace('#', '') + text.substring(lineEnd);
            // Adjust caret position due to character removal
            caretPos -= 1;
        } else {
            // Comment out
            newText = text.substring(0, lineStart) + '#' + lineText + text.substring(lineEnd);
            // Adjust caret position due to character addition
            caretPos += 1;
        }

        promptText.value = newText;

        // Restore caret position to the beginning of the line or after the toggled comment
        nextTick(() => (target.selectionStart = target.selectionEnd = caretPos));
    };

    return { toggleComment };
};
