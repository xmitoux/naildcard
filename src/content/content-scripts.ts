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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (textbox as any)._valueTracker = '';
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * ネガティブプロンプト欄が表示中か
 */
export function isNegativePromptVisible() {
    const buttons = document.querySelectorAll('button');

    // ネガティブロンプトボタンをテキストで探す
    for (const button of buttons) {
        const buttonText = button.textContent;
        if (
            buttonText!.includes(NEGATIVE_PROMPT_BUTTON_TEXT_EN) ||
            buttonText!.includes(NEGATIVE_PROMPT_BUTTON_TEXT_JP)
        ) {
            const nextElement = button.nextElementSibling;

            // タブ移動ボタンのdivが同階層にあればネガティブボタンを選択中
            return nextElement && nextElement.tagName === 'DIV';
        }
    }

    return false;
}

/**
 * 生成ボタンを取得する
 */
export function getGenerateButton(buttonText?: string): HTMLElement | null {
    let generateButton: HTMLElement | null = null;

    // 生成ボタンをspanタグのテキストで探す
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
        const span = button.querySelector('span');

        if (!buttonText) {
            if (
                GENERATE_BUTTON_TEXTS_EN.every((text) => span?.textContent?.includes(text)) ||
                GENERATE_BUTTON_TEXTS_JP.every((text) => span?.textContent?.includes(text))
            ) {
                generateButton = button;
                break;
            }
        } else {
            if (span?.textContent === buttonText) {
                generateButton = button;
                break;
            }
        }
    }

    return generateButton;
}

/**
 * プロンプト入力ボタンの作成
 * @param {Function} func 実行する関数
 * @returns {boolean} 作成できたか
 */
export function createDynamicPromptButton(func: EventListenerOrEventListenerObject): boolean {
    const generateButtonOrg = getGenerateButton();
    if (!generateButtonOrg) {
        return false;
    }

    // サイコロボタンが消されてないか確認
    const diceButtonText = '🎲';
    let diceButton = getGenerateButton(diceButtonText);
    if (diceButton) {
        // 残っているなら何もしない
        return false;
    }

    generateButtonOrg.style.width = '85%';
    generateButtonOrg.style.display = 'inline-flex';

    // dynamic promptを入力するボタンを作成する
    diceButton = document.createElement('button');
    diceButton.style.display = 'inline-flex';
    diceButton.style.backgroundColor = 'transparent';
    diceButton.style.border = 'none';
    diceButton.addEventListener('click', func);

    const buttonSpan = document.createElement('span');
    buttonSpan.textContent = diceButtonText;
    buttonSpan.style.fontSize = 'x-large';
    diceButton.appendChild(buttonSpan);

    // 生成ボタンの前に挿入する
    generateButtonOrg.parentNode!.insertBefore(diceButton, generateButtonOrg);

    return true;
}
