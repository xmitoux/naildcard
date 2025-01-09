import { getStorage } from '@/utils/chrome-api';
import {
    DICE_BUTTON_ID,
    DICE_BUTTON_TEXT,
    NEGATIVE_PROMPT_BUTTON_TEXT_EN,
    NEGATIVE_PROMPT_BUTTON_TEXT_JP,
} from '@/constants/nai';
import { createDynamicPrompt, removeCommentLines } from '@/content/dynamic-prompts';
import { generateButton } from '@/content/setupContents';

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

// 🎲ボタン押下時のプロンプト入力処理
const insertPrompt = (prompt: string, wildcards: WildcardMap) => {
    // プロンプトテキストエリアの要素を取得する
    const promptAreaDiv = document.querySelector<HTMLDivElement>('.ProseMirror');
    if (!promptAreaDiv) {
        console.error('プロンプト入力欄がない😢');
        return;
    }

    // プロンプト入力のたびに中身をクリアする
    promptAreaDiv.innerHTML = '';

    const promptRemovedComment = removeCommentLines(prompt);

    // ワイルドカード内のコメント行を削除
    const wildcardsRemovedComment = { ...wildcards };
    Object.keys(wildcards).forEach((key) => {
        wildcardsRemovedComment[key] = wildcards[key]
            .map((wildcard) => {
                return removeCommentLines(wildcard);
            })
            // コメントによって空になった行を削除
            .filter((wildcard) => !!wildcard);
    });

    const stringToInsert = createDynamicPrompt(promptRemovedComment, wildcardsRemovedComment);

    // プロンプトの各行をp要素として追加していく
    const lines = stringToInsert.split('\n');
    lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        promptAreaDiv.appendChild(p);
    });
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
