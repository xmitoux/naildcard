type TextPosition = [start: number, end: number];
type BracketType = 'curly' | 'square';
type Action = 'add' | 'remove';

export const useControlBracket = (promptText: Ref<string>) => {
    const controlBracket = (event: KeyboardEvent) => {
        const isCtrl = event.ctrlKey;
        const isAlt = event.altKey;
        const isArrowUp = event.code === 'ArrowUp';
        const isArrowDown = event.code === 'ArrowDown';

        if ((!isCtrl && !isAlt) || (!isArrowUp && !isArrowDown)) {
            return;
        }

        event.preventDefault();
        const target = event.target as HTMLTextAreaElement;
        const targetText = target.value;

        const selectionStart = target.selectionStart;
        const selectionEnd = target.selectionEnd;

        const updateText = (position: TextPosition, isTextSelected: boolean) => {
            const bracketType: BracketType = isCtrl ? 'curly' : 'square';
            const bracketAction: Action = isArrowUp ? 'add' : 'remove';
            const bracketedText = bracketText(targetText, position, bracketType, bracketAction);

            if (promptText.value !== bracketedText) {
                promptText.value = bracketedText;

                // ブラケット後に選択状態、またはキャレット位置をそのままにする
                nextTick(() => {
                    target.selectionStart = selectionStart + (bracketAction === 'add' ? 1 : -1);
                    target.selectionEnd =
                        (isTextSelected ? selectionEnd : selectionStart) +
                        (bracketAction === 'add' ? 1 : -1);
                });
            }
        };

        if (selectionStart !== selectionEnd) {
            // 選択状態ならその文字列をブラケット
            updateText([selectionStart, selectionEnd], true);
            return;
        }

        const caretPosition = target.selectionStart;
        const leftText = promptText.value.substring(0, caretPosition);
        const rightText = promptText.value.substring(caretPosition);

        const bracketPosition = getBracketPosition(caretPosition, leftText, rightText);
        if (bracketPosition) {
            // キャレットが括弧内にあるならその中身をブラケット
            updateText(bracketPosition, false);
            return;
        }

        // 微妙なキャレット位置でのキャンセル処理
        const cancelDelimiters = ['{', '[', '}', ']', ',', ' ', '\n'];
        const charBeforeCaret = promptText.value[caretPosition - 1];
        const charAfterCaret = promptText.value[caretPosition];

        if (
            cancelDelimiters.includes(charBeforeCaret) &&
            (cancelDelimiters.includes(charAfterCaret) || !charAfterCaret)
        ) {
            return;
        }

        const delimiterPosition = getDelimiterPosition(caretPosition, leftText, rightText);
        updateText(delimiterPosition, false);
    };

    const getBracketPosition = (
        caretPosition: number,
        leftText: string,
        rightText: string,
    ): TextPosition | null => {
        const leftTextBracketBefore = Math.max(
            leftText.lastIndexOf('{') !== -1 ? leftText.lastIndexOf('{') : -1,
            leftText.lastIndexOf('[') !== -1 ? leftText.lastIndexOf('[') : -1,
        );

        const leftTextBracketAfter = Math.max(
            leftText.lastIndexOf('}') !== -1 ? leftText.lastIndexOf('}') : -1,
            leftText.lastIndexOf(']') !== -1 ? leftText.lastIndexOf(']') : -1,
        );

        const rightTextBracketAfter = Math.min(
            rightText.indexOf('}') !== -1 ? rightText.indexOf('}') : Infinity,
            rightText.indexOf(']') !== -1 ? rightText.indexOf(']') : Infinity,
        );

        const rightTextBracketBefore = Math.min(
            rightText.indexOf('{') !== -1 ? rightText.indexOf('{') : Infinity,
            rightText.indexOf('[') !== -1 ? rightText.indexOf('[') : Infinity,
        );

        if (leftTextBracketBefore === -1 && rightTextBracketBefore !== Infinity) {
            // キャレットの左に始め括弧がなく、右に始め括弧があるならここは括弧内ではない
            return null;
        }

        if (rightTextBracketAfter === -1 && leftTextBracketAfter !== -1) {
            // キャレットの右に閉じ括弧がなく、キャレットの左に閉じ括弧があるならここは括弧内ではない
            return null;
        }

        if (leftTextBracketBefore < leftTextBracketAfter) {
            // キャレットの左の最寄りの括弧が { → } の順ならここは括弧内ではない
            return null;
        }

        if (rightTextBracketBefore < rightTextBracketAfter) {
            // キャレットの右の最寄りの括弧が { → } の順ならここは括弧内ではない
            return null;
        }

        if (leftTextBracketBefore !== -1 && rightTextBracketAfter !== Infinity) {
            return [leftTextBracketBefore + 1, caretPosition + rightTextBracketAfter];
        } else {
            return null;
        }
    };

    const getDelimiterPosition = (
        caretPosition: number,
        leftText: string,
        rightText: string,
    ): TextPosition => {
        // 区切り文字のリスト
        const delimiters = [',', ', ', ' ,', '(', '|', '<', '\n'];

        const delimiterBefore = Math.max(
            ...delimiters.map(
                (delimiter) => leftText.lastIndexOf(delimiter) + (delimiter.length > 1 ? 1 : 0),
            ),
        );

        const delimiterAfter = Math.min(
            ...delimiters.map((delimiter) =>
                rightText.indexOf(delimiter) !== -1 ? rightText.indexOf(delimiter) : Infinity,
            ),
        );

        const start = delimiterBefore === -1 ? 0 : delimiterBefore + 1;
        const end =
            delimiterAfter === Infinity
                ? leftText.length + rightText.length
                : caretPosition + delimiterAfter;

        return [start, end];
    };

    const bracketText = (
        promptText: string,
        [startPosition, endPosition]: TextPosition,
        type: BracketType,
        action: Action,
    ): string => {
        let openBracket: string, closeBracket: string;

        if (type === 'curly') {
            openBracket = '{';
            closeBracket = '}';
        } else {
            openBracket = '[';
            closeBracket = ']';
        }

        if (action === 'add') {
            // 括弧でテキストを囲む
            return (
                promptText.substring(0, startPosition) +
                openBracket +
                promptText.substring(startPosition, endPosition) +
                closeBracket +
                promptText.substring(endPosition)
            );
        } else {
            if (
                promptText.substring(startPosition - 1, startPosition) === openBracket &&
                promptText.substring(endPosition, endPosition + 1) === closeBracket
            ) {
                return (
                    promptText.substring(0, startPosition - 1) +
                    promptText.substring(startPosition, endPosition) +
                    promptText.substring(endPosition + 1)
                );
            } else {
                return promptText;
            }
        }
    };

    const autoBracket = (event: InputEvent) => {
        const openBraces = ['(', '{', '[', '<', '#'];
        const closeBraces = [')', '}', ']', '>', '#'];
        const target = event.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const inputChar = event.data ?? '';
        const nextChar = target.value.charAt(start); // get the character right after the caret

        if (openBraces.includes(inputChar)) {
            // text is selected, enclose it
            if (start !== end) {
                event.preventDefault();

                const braceIndex = openBraces.indexOf(inputChar);
                const selectedText = target.value.slice(start, end);

                // set the textarea value to the enclosed text
                promptText.value =
                    target.value.slice(0, start) +
                    openBraces[braceIndex] +
                    selectedText +
                    closeBraces[braceIndex] +
                    target.value.slice(end);

                // updateHistory(promptText.value);

                nextTick(() => {
                    target.selectionStart = start;
                    target.selectionEnd = end + 2;
                });
            }
            // caret is at the end of the input or next character is space, auto insert closing brace and put caret inside
            else if (
                target.selectionStart === target.value.length ||
                nextChar === ' ' ||
                nextChar === '\n'
            ) {
                event.preventDefault();

                const braceIndex = openBraces.indexOf(inputChar);

                promptText.value =
                    target.value.slice(0, start) +
                    openBraces[braceIndex] +
                    closeBraces[braceIndex] +
                    target.value.slice(end);

                // updateHistory(promptText.value);

                nextTick(() => {
                    target.selectionStart = start + 1;
                    target.selectionEnd = start + 1;
                });
            }
        }
    };

    return {
        controlBracket,
        autoBracket,
    };
};
