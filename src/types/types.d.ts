type Settings = {
    naildcardEnabled: boolean;
    prompt: string;
    wildcards: string;
    danbooruTagHistories: string;
};

type WildcardMap = Record<string, string[]>;
type PromptTextareaRef = { textareaRef: { textarea: HTMLTextAreaElement } } | null;

type DanbooruTag = {
    name: string;
    category: number;
    postsCount: number;
    maybeNames: string[];
};

type TagCommaPosition = 'None' | 'Before Tag' | 'After Tag' | 'Both Sides of Tag' | 'Auto';
