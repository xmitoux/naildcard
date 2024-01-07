/**
 * プロンプト生成
 */
export function createDynamicPrompt(template: string, wildcardMap: WildcardMap) {
    let resultPrompt = template;

    // 部分コメント#...#の削除
    const removeHashEnclosedText = (text: string): string => {
        const regex = /#.*?#/g;
        return text.replace(regex, '');
    };

    resultPrompt = removeHashEnclosedText(template);

    const weightRegex = /^(\d+::)?(.+)$/;
    const selectionRegex = /^(\d*-?\d*)\$\$/;

    // 複数候補と重み付け(n::)を考慮した選択
    const selectRandomByWeight = (variants: string[], selectionCount: number = 1): string => {
        const selectedVariants: string[] = [];
        const variantsClone = [...variants];

        for (let i = 0; i < selectionCount; i++) {
            const weights = variantsClone.map((variant) => {
                const match = weightRegex.exec(variant);
                return match && match[1] ? parseInt(match[1].slice(0, -2), 10) : 1;
            });

            const sumOfWeights = weights.reduce((sum, weight) => sum + weight, 0);
            const rand = Math.random() * sumOfWeights;
            let weightSum = 0;

            for (let j = 0; j < variantsClone.length; j++) {
                weightSum += weights[j];
                if (rand < weightSum) {
                    selectedVariants.push(variantsClone[j].replace(weightRegex, '$2'));
                    variantsClone.splice(j, 1); // Remove selected variant to prevent re-selection
                    break;
                }
            }
        }

        return selectedVariants.join(', ');
    };

    // 候補数選択数(n$$)を解析する
    const parseSelectionCount = (selectionSpec: string, variantCount: number): number => {
        const selectionMatch = selectionRegex.exec(selectionSpec);
        if (!selectionMatch) {
            return 1;
        }

        const [min, max] = selectionMatch[1]
            .split('-')
            .map((n) => (n === '' ? Infinity : parseInt(n)));

        if (max === undefined) {
            // 固定値指定 (n$$) このときだけmaxがundefinedになる
            return min;
        } else {
            // 範囲指定 (min-max$$)
            const rangeMin = min === Infinity ? 1 : min;
            const rangeMax = max === Infinity ? variantCount - 1 : max;
            return Math.floor(Math.random() * (rangeMax - rangeMin + 1)) + rangeMin;
        }
    };

    const replaceVariants = (bracketedStr: string): string => {
        // ()のエスケープ '\(', '\)' を更にエスケープ
        const escBracketReplacedValue = bracketedStr
            .replaceAll('\\(', '\\^')
            .replaceAll('\\)', '\\$');

        let oldValue: string | null = null;
        let newValue = escBracketReplacedValue;
        while (oldValue !== newValue) {
            oldValue = newValue;
            newValue = oldValue.replace(/\(([^()]+)\)/g, (_match, inner: string) => {
                if (!inner) {
                    return '';
                }
                // n$$ を削除して候補の配列を作る
                const variants = inner.replace(selectionRegex, '').split('|');
                const variantsCount = variants.length;
                const selectionCount = parseSelectionCount(inner, variantsCount);

                const selectedVariants = selectRandomByWeight(variants, selectionCount);

                return selectedVariants;
            });
        }
        const finalStr = newValue.replaceAll('\\^', '(').replaceAll('\\$', ')');
        return finalStr;
    };

    resultPrompt = replaceVariants(resultPrompt);

    // <>の選択 選択するかしないかの2択 負数の重みで選択しない重み付けが可能
    const onOffVariantsRegexp = /<([^>]*)>/g;
    const replaceOnOffVariants = (str: string): string => {
        let oldValue: string | null = null;
        let newValue = str;

        while (oldValue !== newValue) {
            oldValue = newValue;
            newValue = oldValue.replace(onOffVariantsRegexp, (_match, inner: string) => {
                if (!inner) {
                    return '';
                }

                let variants: string[];

                // 重みが指定されているか確認
                const weightMatch = inner.match(/^(-?\d+)::(.*)$/);
                if (!weightMatch) {
                    // 重みが指定されていない場合はそのまま
                    variants = [inner, ' '];
                } else {
                    const weight = parseInt(weightMatch[1]);
                    const variant = weightMatch[2];

                    if (weight >= 0) {
                        // 重みが正の場合はそのまま
                        variants = [inner, ' '];
                    } else {
                        // 重みが負の場合は半角スペースの方に重み付け
                        const negativeWeight = weight * -1;
                        const weightedSpace = `${negativeWeight}:: `;
                        variants = [variant, weightedSpace];
                    }
                }

                const selectedVariants = selectRandomByWeight(variants);

                return selectedVariants;
            });
        }

        return newValue;
    };

    resultPrompt = replaceOnOffVariants(resultPrompt);

    const escapeRegExp = (str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $&はマッチした全体文字列を意味します
    };
    const replaceWildcards = (prompt: string): string => {
        let replacedPrompt = prompt;

        Object.keys(wildcardMap).forEach((key) => {
            const wildcardKeyRegexp = new RegExp(
                `__(\\d*-?\\d*\\$\\$)?${escapeRegExp(key)}__`,
                'g',
            );

            replacedPrompt = replacedPrompt.replace(wildcardKeyRegexp, (_, inner) => {
                const variantsCount = wildcardMap[key].length;
                const selectionCount = parseSelectionCount(inner, variantsCount);

                return replaceOnOffVariants(
                    replaceVariants(selectRandomByWeight(wildcardMap[key], selectionCount)),
                );
            });
        });

        return replacedPrompt;
    };

    resultPrompt = replaceWildcards(resultPrompt);
    // nested wildcard
    resultPrompt = replaceWildcards(resultPrompt);

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
