import { parseWildcardsString } from '@/utils/utils';
import { createPrompt, removeCommentLines } from './dynamic-prompts';
import {
    GENERATE_BUTTON,
    NEGATIVE_PROMPT_BUTTON_EN,
    NEGATIVE_PROMPT_BUTTON_JP,
} from '@/constants/nai';

/**
 * プロンプト入力処理
 */
export function insertPrompt(prompt: string, wildcards: string) {
    const textbox = document.querySelector('textarea');
    if (textbox != null) {
        const stringToInsert = createPrompt(
            removeCommentLines(prompt),
            parseWildcardsString(removeCommentLines(wildcards)),
        );

        textbox.value = stringToInsert;

        // プロンプト欄のReactコンポーネントのinputイベントを発火させてテキスト入力を確定させる
        (textbox as any)._valueTracker = '';
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * ネガティブプロンプト欄が表示中か
 */
export function isNegativePromptVisible() {
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
        const buttonText = button.textContent;
        if (
            buttonText!.includes(NEGATIVE_PROMPT_BUTTON_EN) ||
            buttonText!.includes(NEGATIVE_PROMPT_BUTTON_JP)
        ) {
            const nextElement = button.nextElementSibling;

            return nextElement && nextElement.tagName === 'DIV';
        }
    }

    return false;
}

/**
 * プロンプト入力ボタンの作成
 * @param {Function} func 実行する関数
 * @returns {boolean} 作成できたか
 */
export function createDynamicPromptButton(func: EventListenerOrEventListenerObject): boolean {
    const generateButtonOrg = document.querySelector(GENERATE_BUTTON) as HTMLElement;

    if (!generateButtonOrg) {
        return false;
    }

    generateButtonOrg.style.width = '85%';
    generateButtonOrg.style.display = 'inline-flex';

    // dynamic promptを入力するボタンを作成する
    const button = document.createElement('button');
    button.style.display = 'inline-flex';
    button.style.backgroundColor = 'transparent';
    button.style.border = 'none';
    button.addEventListener('click', func);

    const buttonSpan = document.createElement('span');
    buttonSpan.textContent = '🎲';
    buttonSpan.style.fontSize = 'x-large';
    button.appendChild(buttonSpan);

    // 生成ボタンの前に挿入する
    generateButtonOrg.parentNode!.insertBefore(button, generateButtonOrg);

    return true;
}
