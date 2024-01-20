<script setup lang="ts">
import { ElAutocomplete, ElButton, ElCheckbox } from 'element-plus';
import { List, Checked } from '@element-plus/icons-vue';

const props = defineProps<{
    savedTagHistories: string;
    options: {
        searchOnlyGeneralTags: boolean;
    };
}>();
const emit = defineEmits<{ select: [tag: string]; changeHistories: [tags: DanbooruTag[]] }>();

const fuzzySearchMode = ref(true);

const selectedTagHistories = ref<DanbooruTag[]>([]);
// 設定(タグ履歴)の読み込み読み込みを待ってデシリアライズ
watchEffect(() => (selectedTagHistories.value = JSON.parse(props.savedTagHistories)));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectTag: (tag: any) => void = (tag: FilteredDanbooruTag) => {
    emit('select', tag.name);

    const updateTagHistory = (tag: FilteredDanbooruTag): void => {
        const index = selectedTagHistories.value.findIndex((item) => item.name === tag.name);
        if (index !== -1) {
            // 入力履歴を選択したなら一番上に移動
            const [foundTag] = selectedTagHistories.value.splice(index, 1);
            selectedTagHistories.value.unshift(foundTag);
        } else {
            // 未登録の入力履歴なら追加
            const { isActual: _, ...tmpTag } = tag;
            selectedTagHistories.value.unshift(tmpTag);
        }

        emit('changeHistories', selectedTagHistories.value);
    };

    updateTagHistory(tag);
};

const inputTag = ref('');

const clearTag = () => {
    inputTag.value = '';
    emit('select', '');
};

const autocomleteRef = ref<InstanceType<typeof ElAutocomplete>>();

defineExpose({
    clearTag,
    focus: () => {
        autocomleteRef.value?.focus();
    },
});

const danbooruTags = ref<DanbooruTag[]>([]);

onMounted(() => {
    danbooruTags.value = loadDanbooruTags();
});

const loadDanbooruTags = (): DanbooruTag[] => {
    const csvToObjects = (csv: string): DanbooruTag[] => {
        const lines = csv.split('\n');
        const headers = lines[0].split(',') as (keyof DanbooruTag)[];

        return lines.slice(1).map((line) => {
            const pattern = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
            const dataList = [...line.matchAll(pattern)].map((match) =>
                match[0].replace(/^"|"$/g, ''),
            );

            const obj: Partial<DanbooruTag> = {};

            headers.forEach((header, index) => {
                const data = dataList[index] || ''; // 空の場合の対策として空文字をデフォルト値とする

                switch (header) {
                    case 'name':
                        obj.name = data;
                        break;

                    case 'category':
                    case 'postsCount': {
                        const num = parseInt(data) as DanbooruTagCategory;
                        if (!isNaN(num)) {
                            obj[header] = num;
                        }

                        break;
                    }

                    case 'maybeNames':
                        if (data.includes(',')) {
                            // ""で囲まれた複数の単語を持つケース
                            obj.maybeNames = data.split(',');
                        } else if (data) {
                            // 単一の単語を持つケース
                            obj.maybeNames = [data];
                        } else {
                            // 単語が存在しないケース
                            obj.maybeNames = [];
                        }

                        break;

                    default:
                        throw new Error(`Unexpected CSV header name found! ${header}`);
                }
            });

            return obj as DanbooruTag;
        });
    };

    // プロンプトで最終的に消す"_"を、検索で考慮しても意味がないので除去する
    return csvToObjects(DANBOORU_CSV.replaceAll('_', ' '));
};

type FilteredDanbooruTag = DanbooruTag & { isActual: boolean };
type SearchCallBack = (results: DanbooruTag[] | FilteredDanbooruTag[]) => void;

let timeout: ReturnType<typeof setTimeout>;
const fetchSuggestions = (queryString: string, callback: SearchCallBack) => {
    if (queryString === '') {
        // クエリを空欄にした直後はtrigger-on-focusが動いて全件検索してしまうので空を返す
        callback([]);
        return;
    }

    let results: FilteredDanbooruTag[] = fuzzySearchMode.value
        ? fuzzySearch(queryString)
        : normalSearch(queryString);

    // 結果を全件出すと重いので削る
    results = results.slice(0, TAG_HELPER_SUGGESTION_COUNT - 1);

    if (props.options.searchOnlyGeneralTags) {
        results = results.filter((tag) => tag.category === 0);
    }

    // 部分一致検索が遅いので非同期で実行して画面を止めない
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        callback(results);
    }, 1);
};

const fuzzySearch = (queryString: string): FilteredDanbooruTag[] => {
    const results: FilteredDanbooruTag[] = danbooruTags.value.reduce(
        (resultTags: FilteredDanbooruTag[], tag) => {
            const isMaybeWord = tag.maybeNames.some(
                (maybeName) => maybeName.indexOf(queryString) === 0,
            );

            if (queryString.includes(' ')) {
                // 検索クエリにスペースがある場合はAND検索

                // 検索クエリのすべての単語がタグの各単語に前方一致するか判定する関数
                const doesQueryPartialMatch = (query: string[], target: string[]): boolean => {
                    const targetWordCounts = target.reduce(
                        (countMap, word) => {
                            countMap[word] = (countMap[word] || 0) + 1;
                            return countMap;
                        },
                        {} as Record<string, number>,
                    );

                    for (let word of query) {
                        let isMatch = false;
                        for (let targetWord of Object.keys(targetWordCounts)) {
                            if (targetWord.startsWith(word) && targetWordCounts[targetWord] > 0) {
                                targetWordCounts[targetWord]--;
                                isMatch = true;
                                break;
                            }
                        }
                        if (!isMatch) return false;
                    }
                    return true;
                };

                const tagWords = tag.name.split(' ');
                const queryWords = queryString.split(' ');

                if (tagWords.length >= 2 && doesQueryPartialMatch(queryWords, tagWords)) {
                    resultTags.push({ ...tag, isActual: true });
                } else if (isMaybeWord) {
                    resultTags.push({ ...tag, isActual: false });
                }
            } else {
                // 検索クエリにスペースがない場合は前方部分一致検索

                // クエリの各文字がタグ文字列内の何処かに順番に存在するかチェック
                const doesQueryMatch = (query: string, tagString: string): boolean => {
                    let queryIndex = 0;
                    for (let i = 0; i < tagString.length && queryIndex < query.length; i++) {
                        if (tagString[i] === query[queryIndex]) {
                            queryIndex++;
                        }
                    }
                    return queryIndex === query.length;
                };

                if (doesQueryMatch(queryString, tag.name)) {
                    resultTags.push({ ...tag, isActual: true });
                } else if (isMaybeWord) {
                    resultTags.push({ ...tag, isActual: false });
                }
            }

            return resultTags;
        },
        [],
    );

    return results;
};

const normalSearch = (queryString: string): FilteredDanbooruTag[] => {
    const results: FilteredDanbooruTag[] = danbooruTags.value.reduce(
        (resultTags: FilteredDanbooruTag[], tag) => {
            const isMaybeWord = tag.maybeNames.some(
                (maybeName) => maybeName.indexOf(queryString) === 0,
            );

            if (tag.name.indexOf(queryString) === 0) {
                resultTags.push({ ...tag, isActual: true });
            } else if (isMaybeWord) {
                resultTags.push({ ...tag, isActual: false });
            }
            return resultTags;
        },
        [],
    );

    return results;
};

// オートコンプリートに出すタグ名を取得する
// (inputのフィルタ時点では本タグともしかしてタグのどちらが一致しているかわからないのでここで確定させる)
const getSuggestionTag = (tag: DanbooruTag | FilteredDanbooruTag): string => {
    if (!('isActual' in tag) || tag.isActual) {
        // 入力履歴にもしかしての概念はないのでそのままタグ名を出す
        return tag.name;
    } else {
        return `${tag.maybeNames.find((maybe) => maybe.indexOf(inputTag.value) === 0)} → ${
            tag.name
        }`;
    }
};

const formatPostsCountSuffix = (num: number): string => {
    const formatValue = (value: number, divisor: number, suffix: string) => {
        const result = value / divisor;
        const integerDigits = Math.floor(result).toString().length;
        return integerDigits === 1 ? result.toFixed(1) + suffix : Math.floor(result) + suffix;
    };

    if (num >= 1000000) {
        return formatValue(num, 1000000, 'M');
    } else if (num >= 1000) {
        return formatValue(num, 1000, 'k');
    } else {
        return num.toString();
    }
};

const categoryColors: Record<DanbooruTagCategory, string> = {
    0: '#2BBAFF', // 青 一般タグ
    1: '#FF7A7B', // 赤 絵師タグ
    3: '#BC83FF', // 紫 版権タグ
    4: '#4CCF5F', // 緑 キャラ名タグ
    5: '#E6A23C', // オレンジ メタタグ
};

const { copying, copyToClipboard } = useClipboardCopy();

const deleteHistory = (event: KeyboardEvent) => {
    event.preventDefault();

    if (inputTag.value) {
        return;
    }

    const selectedIndex = autocomleteRef.value!.highlightedIndex;

    selectedTagHistories.value = [...selectedTagHistories.value].toSpliced(selectedIndex, 1);
    autocomleteRef.value!.activated = true;
    autocomleteRef.value!.suggestions = selectedTagHistories.value;

    emit('changeHistories', selectedTagHistories.value);
};

// タブキーでの候補選択
const keydownTab = (e: KeyboardEvent) => {
    if (!autocomleteRef.value) {
        return;
    }

    const selectedIndex = autocomleteRef.value.highlightedIndex;
    if (selectedIndex === -1) {
        // 未選択状態なら通常のタブ動作
        return;
    }

    e.preventDefault();

    const suggestions = autocomleteRef.value.suggestions as FilteredDanbooruTag[];
    const selectedTag = suggestions[selectedIndex];
    inputTag.value = selectedTag.name;

    // タグ挿入後のフォーカスで前回候補が表示されてしまうので消しておく
    // (普通にエンターキーで選んだときは起きないので、正規のonSelctでは内部的にこうしてる？)
    autocomleteRef.value.suggestions = [];
    selectTag(selectedTag);
};

const onClick = () => {
    // 未入力時にクリックしたときだけ履歴表示
    if (!inputTag.value) {
        autocomleteRef.value!.activated = true;
        autocomleteRef.value!.suggestions = selectedTagHistories.value;
    }
};
</script>

<template>
    <ElAutocomplete
        v-model="inputTag"
        clearable
        :debounce="10"
        :fetch-suggestions="fetchSuggestions"
        fit-input-width
        highlight-first-item
        placeholder="Input Danbooru Tag"
        ref="autocomleteRef"
        style="width: 500px"
        :trigger-on-focus="!!inputTag"
        value-key="name"
        @click="onClick"
        @clear="clearTag"
        @input="emit('select', '')"
        @keydown.ctrl.delete="deleteHistory"
        @keydown.tab="keydownTab"
        @select="selectTag"
    >
        <template #prepend>
            <ElCheckbox v-model="fuzzySearchMode" label="Fuzzy Search" />
        </template>

        <template #append>
            <ElButton
                :disabled="!inputTag || copying"
                :icon="copying ? Checked : List"
                @click="copyToClipboard(inputTag)"
            />
        </template>

        <template #default="{ item: tag }: { item: FilteredDanbooruTag }">
            <div class="suggestion-container">
                <span class="suggestion" :style="{ color: categoryColors[tag.category] }">
                    {{ getSuggestionTag(tag) }}
                </span>

                <span class="posts-count">{{ formatPostsCountSuffix(tag.postsCount) }}</span>
            </div>
        </template>
    </ElAutocomplete>
</template>

<style scoped>
.suggestion-container {
    padding: 2px;
    display: flex;
    justify-content: space-between;
    position: relative;
}

.suggestion {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1; /* 左側のspanが可能な限りスペースを占めるようにする */
}
</style>
