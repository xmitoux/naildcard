/**
 * プロンプト生成
 */
export function createPrompt(template: string, wildcardMap: WildcardMap) {
    let resultPrompt = template;

    // 重み付け(n::)要素の選択
    const weightRegex = /^(\d+::)?(.+)$/;
    const selectRandomByWeight = (variants: string[]): string => {
        if (!variants.length) {
            // 空のワイルドカードはエラーになるので空文字を返す
            return '';
        }

        const weights = variants.map((variant) => {
            const weightMatch = weightRegex.exec(variant);

            if (weightMatch === null) {
                return 1;
            }

            return weightMatch[1] ? parseInt(weightMatch[1].slice(0, -1), 10) : 1;
        });

        const sumOfWeights = weights.reduce((a, b) => a + b);
        const randNum = Math.random() * sumOfWeights;
        let weightSum = 0;

        for (let i = 0; i < weights.length; i++) {
            weightSum += weights[i];
            if (randNum < weightSum) {
                return variants[i].replace(weightRegex, '$2');
            }
        }

        // デフォルトの戻り値を設定します
        // ここでは、variants配列の最初の要素を返すか、空文字列を返すことにします
        return variants.length > 0 ? variants[0].replace(weightRegex, '$2') : '';
    };

    // ()の選択
    const replaceBracketedParams = (bracketedStr: string): string => {
        let replacedValue: string = bracketedStr;
        let oldValue: string | null = null;

        while (oldValue !== replacedValue) {
            oldValue = replacedValue;
            replacedValue = oldValue.replace(/\(([^()]+)\)/g, (_match, inner: string) => {
                // innerがundefinedの場合に備えて、適切な処理を行います
                // selectRandomByWeight関数の型に応じて、inner.split('|')の型を調整する必要があります
                return inner ? selectRandomByWeight(inner.split('|')) : '';
            });
        }

        return replacedValue;
    };

    resultPrompt = replaceBracketedParams(resultPrompt);

    // <>の選択 選択するかしないかの2択 負数の重みで選択しない重み付けが可能
    const replaceAngleBracketedParams = (str: string) => {
        const regex = /<[^>]*>/g;
        const matches = str.match(regex);

        if (!matches) {
            return str;
        }

        const extractString = (input: string) => {
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
        };

        for (const match of matches) {
            const content = extractString(match) || [];
            const choice = selectRandomByWeight(content);
            str = str.replace(match, choice);
        }

        return str;
    };

    resultPrompt = replaceAngleBracketedParams(resultPrompt);

    Object.keys(wildcardMap).forEach((key) => {
        const re = new RegExp(`__${key}__`, 'g');
        resultPrompt = resultPrompt.replace(re, () => {
            return replaceAngleBracketedParams(
                replaceBracketedParams(selectRandomByWeight(wildcardMap[key])),
            );
        });
    });

    // nested wildcard
    Object.keys(wildcardMap).forEach((key) => {
        const re = new RegExp(`__${key}__`, 'g');
        resultPrompt = resultPrompt.replace(re, () => {
            return replaceAngleBracketedParams(
                replaceBracketedParams(selectRandomByWeight(wildcardMap[key])),
            );
        });
    });

    return resultPrompt;
}

/**
 * #コメント行を除去する(テンプレートとパース前のワイルドカード共用)
 */
export function removeCommentLines(str: string) {
    const targetChar = '#';

    // 文字列を行ごとに分割
    const lines = str.split('\n');
    // #で始まる行を除去
    const filteredLines = lines.filter((line) => !line.trim().startsWith(targetChar));
    // 行を連結して最終的な文字列を得る
    const result = filteredLines.join('\n');

    return result;
}
