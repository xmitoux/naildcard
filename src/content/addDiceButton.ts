import { getStorage } from '@/utils/chrome-api';

export const addDiceButton = ({ naildcardEnabled }: Settings) => {
    const proc = () => {
        const createDiceButton = () => {
            if (!generateButton) {
                return;
            }

            // サイコロボタンが消されてないか確認
            if (document.querySelector(`#${DICE_BUTTON_ID}`)) {
                // 残っているなら何もしない
                return;
            }

            // デフォルトの生成ボタンを縮める
            generateButton.style.display = 'inline-flex';
            generateButton.style.width = '85%';

            const diceButton = document.createElement('button');
            diceButton.id = DICE_BUTTON_ID;
            diceButton.style.display = 'inline-flex';
            diceButton.style.backgroundColor = 'transparent';
            diceButton.style.border = 'none';
            diceButton.style.cursor = 'pointer';
            diceButton.addEventListener('click', onDiceButtonClick);

            const buttonSpan = document.createElement('span');
            buttonSpan.textContent = DICE_BUTTON_TEXT;
            buttonSpan.style.fontSize = 'x-large';
            diceButton.appendChild(buttonSpan);

            // 生成ボタンの前に挿入する
            generateButton.parentNode!.insertBefore(diceButton, generateButton);
        };
        createDiceButton();
    };

    naildcardEnabled &&
        new MutationObserver(proc).observe(document.body, { childList: true, subtree: true });
};

const onDiceButtonClick = () => {
    getStorage(({ prompt, wildcards }) => {
        if (!isNegativePromptVisible()) {
            // ポジティブプロンプト欄が表示中なら入力する
            try {
                insertPrompt(prompt, wildcards);
            } catch (error) {
                console.error('insertPrompt failed:', (error as Error).message);
            }
        }
    });
};

const insertPrompt = (prompt: string, wildcards: string) => {
    const textbox = document.querySelector('textarea');
    if (textbox != null) {
        const stringToInsert = createDynamicPrompt(
            removeCommentLines(prompt),
            parseWildcardsString(removeCommentLines(wildcards)),
        );

        textbox.value = stringToInsert;

        // プロンプト欄のReactコンポーネントのinputイベントを発火させてテキスト入力を確定させる
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (textbox as any)._valueTracker = '';
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

const isNegativePromptVisible = () => {
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
};
