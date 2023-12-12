/**
 * プロンプト生成
 */
function createPrompt(template, variableMap) {  
    // テンプレートのコメント行を削除しておく  
    let resultPrompt = removeCommentLines(template);
    
    // 重み付け n::
    const weightRegex = /^(\d+::)?(.+)$/;
    const selectRandomByWeight = (options) => {
        const weights = options.map(option => {
            const weightMatch = weightRegex.exec(option);
            return weightMatch[1] ? parseInt(weightMatch[1].slice(0, -1), 10) : 1;
        });

        const sumOfWeights = weights.reduce((a, b) => a + b);
        const randNum = Math.random() * sumOfWeights;
        let weightSum = 0;

        for (let i = 0; i < weights.length; i++) {
            weightSum += weights[i];
            if (randNum < weightSum) {
                return options[i].replace(weightRegex, "$2");
            }
        }
    }

    // ()の選択
    const replaceBracketedParams = (value) => {
        let replacedValue = value;
        let oldValue = null;

        while (oldValue !== replacedValue) {
            oldValue = replacedValue;
            replacedValue = oldValue.replace(/\(([^()]+)\)/g, (match, inner) => {
                return selectRandomByWeight(inner.split('|'));
            });
        }

        return replacedValue;
    }

    resultPrompt = replaceBracketedParams(resultPrompt);

    // <>の選択 選択するかしないかの2択 負数の重みで選択しない重み付けが可能
    const replaceAngleBracketedParams = (str) => {
        const regex = /<[^>]*>/g;
        const matches = str.match(regex);

        if (!matches) {
            return str;
        }

        const extractString = (input) => {
            // 正規表現を使用して<>内の文字列を抽出
            const match = input.match(/<([^>]*)>/);
        
            if (match) {
                const extractedString = match[1];
                
                // 重みが指定されているか確認
                const weightMatch = extractedString.match(/^(-?\d+)::(.*)$/);
            
                if (weightMatch) {
                    // 重みが正の場合はそのまま返す
                    if (parseInt(weightMatch[1]) >= 0) {
                    return [extractedString, ' '];
                    } else {
                    // 重みが負の場合は半角スペースの方に-1倍して追加して返す
                    const negativeWeight = parseInt(weightMatch[1]);
                    const remainingString = weightMatch[2];
                    const weightedSpace = `${negativeWeight * -1}:: `;
                    return [remainingString, weightedSpace];
                    }
                } else {
                    // 重みが指定されていない場合は半角スペースを追加して返す
                    return [extractedString, ' '];
                }
            }
        }

        for (let match of matches) {
            const content = extractString(match);
            const choice = selectRandomByWeight(content);
            str = str.replace(match, choice);
        }

        return str;
    }

    resultPrompt = replaceAngleBracketedParams(resultPrompt);

    Object.keys(variableMap).forEach(key => {
        const re = new RegExp(`__${key}__`, 'g');
        resultPrompt = resultPrompt.replace(re, function() {
            return replaceAngleBracketedParams(replaceBracketedParams(selectRandomByWeight(variableMap[key])));
        });
    });

    // nested wildcard
    Object.keys(variableMap).forEach(key => {
        const re = new RegExp(`__${key}__`, 'g');
        resultPrompt = resultPrompt.replace(re, function() {
            return replaceAngleBracketedParams(replaceBracketedParams(selectRandomByWeight(variableMap[key])));
        });
    });

    return resultPrompt;
}

/**
 * wildcardのパース
 */
function parseWildcardsString(input) {
    let output = {};
    
    // コメント行を削除しておく
    let lines = removeCommentLines(input).split('\n');

    let currentKey = null;
    lines.forEach(line => {
        line = line.trim(); // Remove spaces at the beginning and end of the line

        if (!line || /^\s*$/gi.test(line)) { 
            // Ignore empty lines or lines contain only spaces
            return;
        } else if (line.endsWith(':')) {
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

/**
 * #コメント行を除去する(テンプレートとパース前のワイルドカード共用)
 */
const removeCommentLines = (str) => {
    const targetChar = '#';

    // 文字列を行ごとに分割
    const lines = str.split('\n');    
    // #で始まる行を除去
    const filteredLines = lines.filter(line => !line.trim().startsWith(targetChar));
    // 行を連結して最終的な文字列を得る
    const result = filteredLines.join('\n');

    return result;
}

/**
 * RapidFireのプロンプト入力処理
 */
function insertPrompt(prompt, wildcards) {
    const textbox = document.querySelector('textarea');
    if (textbox != null) {
        const stringToInsert = createPrompt(prompt, parseWildcardsString(wildcards));
        textbox.value = stringToInsert;
        
        // プロンプト欄のReactコンポーネントのinputイベントを発火させてテキスト入力を確定させる
        textbox._valueTracker = '';                
        textbox.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * ポジティブプロンプト欄が表示中か
 */
const isPositivePromptInputVisible = () => {
    // 現在選択中のPromptボタンの要素を取得
    // ポジでもネガでもこのクラスになる
    const promptDivClass = '.sc-9aa632a0-5.fBNpUr';
    const promptDiv = document.querySelector(promptDivClass);
    
    // Promptボタンのdivが子要素divを持つか
    // ネガにはタブ位置変更ボタン(div)があるので、持たないならポジ
    const hasChild = promptDiv && promptDiv.querySelector('div');
    return !hasChild;
};

/**
 * サイコロボタンのオーバーライド
 * @param {Function} overrideFunction オーバーライドする関数
 * @returns {boolean} オーバーライドできたか
 */
function overrideDiceButton(overrideFunction) {
    // サイコロボタンのselector
    // (buttonのclassだけだと同一のものが複数あるので子要素で特定)
    const diceButtonClass = 'button.sc-d72450af-1.kXFbYD > div.sc-876067fe-0.sc-876067fe-128.flOuWA.gTtUqd';

    const diceButton = document.querySelector(diceButtonClass)?.parentElement;
    if (!diceButton) {
        return false;
    }

    // サイコロボタンをクローン(元のイベントリスナはコピーされず消える)
    const diceButtonClone = diceButton.cloneNode(true);
    // オーバーライドしたい関数を追加
    diceButtonClone.addEventListener('click', overrideFunction);
    // 元のボタンを置換
    diceButton.replaceWith(diceButtonClone);

    return true;
}
