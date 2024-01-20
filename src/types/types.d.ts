type Settings = {
    naildcardEnabled: boolean;
    prompt: string;
    wildcards: string;
    danbooruTagHistories: string;
};

type WildcardMap = Record<string, string[]>;
type PromptTextareaRef = { textareaRef: { textarea: HTMLTextAreaElement } } | null;

const DanbooruTagCategory = {
    General = 0,
    Artist = 1,
    Copyright = 3,
    Character = 4,
    Meta = 5,
} as const;

type DanbooruTagCategory = (typeof DanbooruTagCategory)[keyof typeof DanbooruTagCategory];

type DanbooruTag = {
    name: string;
    category: DanbooruTagCategory;
    postsCount: number;
    maybeNames: string[];
};

type TagCommaPosition = 'None' | 'Before Tag' | 'After Tag' | 'Both Sides of Tag' | 'Auto';
