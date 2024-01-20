/**
 * wildcardのパース
 */
export function parseWildcardsString(wildcardsStr: string) {
    const output: WildcardMap = {};

    const lines = wildcardsStr.split('\n');

    let currentKey = '';
    lines.forEach((line) => {
        if (!line || /^\s*$/gi.test(line)) {
            // Ignore empty lines or lines contain only spaces
            if (currentKey) {
                output[currentKey].push(line);
            }
            return;
        } else if (!line.startsWith(':') && line.endsWith(':')) {
            // This is a key
            currentKey = line.slice(0, -1); // Remove the trailing :
            output[currentKey] = [];
        } else {
            // This is a value
            // Ignore if no valid key is defined yet
            if (currentKey) {
                output[currentKey].push(line);
            }
        }
    });

    return output;
}

export const insertDanbooruTagToTextarea = (
    tag: string,
    textareaRef: PromptTextareaRef,
    saveProc: (tagInsertedText: string) => void,
    moveFocus: boolean,
    commaPlacement: TagCommaPosition,
) => {
    if (!textareaRef) {
        return;
    }

    const targetTextarea = textareaRef.textareaRef.textarea;

    const caretPosition = targetTextarea.selectionStart;
    const caretLeftPrompt = targetTextarea.value.substring(0, caretPosition);
    const caretRightPrompt = targetTextarea.value.substring(caretPosition);

    let tagWithComma = tag;

    switch (commaPlacement) {
        case 'Before Tag':
            tagWithComma = ', ' + tag;
            break;

        case 'After Tag':
            tagWithComma += ', ';
            break;

        case 'Both Sides of Tag':
            tagWithComma = ', ' + tag + ', ';
            break;

        case 'Auto': {
            // キャレット左右の状態を検出
            const leftChar = caretLeftPrompt[caretLeftPrompt.length - 1] || ''; // なければ空文字
            const rightChar = caretRightPrompt[0] || ''; // なければ空文字

            const isLeftSymbol = (leftChar: string) => {
                const startChars = ['{', '[', '(', '|', '<'];
                return startChars.some((char) => leftChar === char);
            };

            const isLeftStart = !leftChar || leftChar === '\n' || isLeftSymbol(leftChar);

            const isRightSymbol = (rightChar: string) => {
                const endChars = ['}', ']', ')', '|', '>'];
                return endChars.some((char) => rightChar === char);
            };
            const isRightEnd = !rightChar || rightChar === '\n';

            const isLeftComma = leftChar === ',';
            const isRightComma = rightChar === ',';

            const isLeftSpace = leftChar === ' ';
            const isRightSpace = rightChar === ' ';

            //左右1文字の先にある文字からカンマが必要か判定する
            const needCommaArround = (str: string, direction: 'left' | 'right'): boolean => {
                if (direction === 'left') {
                    for (let i = str.length - 1; i >= 0; i--) {
                        const leftChar = str[i];
                        if (leftChar === ',' || leftChar === '\n' || isLeftSymbol(leftChar)) {
                            return false;
                        }
                        if (leftChar !== ' ') return true;
                    }
                    // 先頭までスペースならカンマ不要
                    return false;
                } else {
                    for (let i = 0; i < str.length; i++) {
                        const rightChar = str[i];
                        if (str[i] === ',' || isRightSymbol(rightChar)) {
                            return false;
                        }
                        if (str[i] !== ' ') return true;
                    }
                    // 文末までスペースならカンマ必要
                    return true;
                }
            };

            if (isLeftStart) {
                // 行頭
                // つけない
            } else if (!isLeftComma && !isLeftSpace) {
                // 左1文字が文字・記号(カンマスペース除く)
                tagWithComma = ', ' + tagWithComma;
            } else if (isLeftComma) {
                // 左1文字がカンマのみ
                tagWithComma = ' ' + tagWithComma;
            } else if (needCommaArround(caretLeftPrompt, 'left')) {
                tagWithComma = ', ' + tagWithComma;
            } else {
                // つけない
            }

            if (isRightEnd) {
                // 行末
                tagWithComma += ', ';
            } else if (isRightSymbol(rightChar)) {
                // 右1文字が終端記号？
                // つけない
            } else if (!isRightComma && !isRightSpace) {
                // 右1文字が文字・記号(カンマスペース除く)？
                tagWithComma += ', ';
            } else if (isRightComma) {
                // 右1文字がカンマのみ
                // つけない
            } else if (needCommaArround(caretRightPrompt, 'right')) {
                tagWithComma += ',';
            } else {
                // つけない
            }

            break;
        }

        default:
            break;
    }

    const tagInsertedText = caretLeftPrompt + tagWithComma + caretRightPrompt;
    saveProc(tagInsertedText);

    nextTick(() => {
        const newCaretPosition = caretPosition + tagWithComma.length;
        targetTextarea.setSelectionRange(newCaretPosition, newCaretPosition);

        if (moveFocus) {
            targetTextarea.focus();
        }
    });
};
